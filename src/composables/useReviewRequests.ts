import { ref, computed, watch } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import { useFirebaseOptimizer } from './useFirebaseOptimizer'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { useNotificationsStore } from '@/stores/notifications'
import { useToast } from './useToast'
import type { ReviewRequest, YearLevel } from '@/types'

// Module-level refs (singleton pattern)
const reviewRequests = ref<ReviewRequest[]>([])
const loading = ref(false)
let initialized = false

const optimizer = useFirebaseOptimizer()
let stopReviewPolling: (() => void) | null = null

async function fetchReviewRequests(email: string): Promise<ReviewRequest[]> {
  // No orderBy — avoids composite index requirement, we sort client-side
  const qReviewer = query(
    collection(db, 'review_requests'),
    where('reviewer', '==', email)
  )

  const qRequester = query(
    collection(db, 'review_requests'),
    where('requestedBy', '==', email)
  )

  const [reviewerSnapshot, requesterSnapshot] = await Promise.all([
    getDocs(qReviewer),
    getDocs(qRequester)
  ])

  const reviewerReqs = reviewerSnapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as ReviewRequest))

  const requesterReqs = requesterSnapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as ReviewRequest))

  const map = new Map<string, ReviewRequest>()
  for (const r of [...reviewerReqs, ...requesterReqs]) {
    if (r.id) map.set(r.id, r)
  }
  
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt)
}

function startPolling(email: string) {
  // Cleanup previous polling
  if (stopReviewPolling) stopReviewPolling()

  loading.value = true

  const queryFn = () => fetchReviewRequests(email)
  const callback = (requests: ReviewRequest[]) => {
    reviewRequests.value = requests
    loading.value = false
  }

  // Start review requests polling (30 seconds)
  stopReviewPolling = optimizer.startPolling('review_requests', queryFn, callback)
}

export function useReviewRequests() {
  const { success, error: showError } = useToast()

  const pendingForMe = computed(() => {
    const authStore = useAuthStore()
    const email = authStore.currentUser?.email || ''
    return reviewRequests.value.filter(
      r => r.reviewer === email && r.status === 'pending'
    )
  })

  const myRequests = computed(() => {
    const authStore = useAuthStore()
    const email = authStore.currentUser?.email || ''
    return reviewRequests.value.filter(r => r.requestedBy === email)
  })

  const pendingCount = computed(() => pendingForMe.value.length)

  const getReviewForOutcome = (outcomeId: string, year: YearLevel) => {
    return reviewRequests.value.find(
      r => r.outcomeId === outcomeId && r.year === year && r.status === 'pending'
    ) || null
  }

  const loadReviewRequests = () => {
    if (initialized) return
    initialized = true

    const authStore = useAuthStore()

    // If email already available, start immediately
    if (authStore.currentUser?.email) {
      startPolling(authStore.currentUser.email)
      return
    }

    // Otherwise, watch for auth to become ready
    const stopWatch = watch(
      () => authStore.currentUser?.email,
      (email) => {
        if (email) {
          startPolling(email)
          stopWatch()
        }
      }
    )
  }

  const createReviewRequest = async (
    outcomeId: string,
    year: YearLevel,
    reviewerEmail: string,
    requestComment?: string
  ) => {
    const authStore = useAuthStore()
    const requesterEmail = authStore.currentUser?.email || ''

    const request: Omit<ReviewRequest, 'id'> = {
      outcomeId,
      year,
      requestedBy: requesterEmail,
      reviewer: reviewerEmail,
      status: 'pending',
      createdAt: Date.now(),
      ...(requestComment && { requestComment })
    }

    await addDoc(collection(db, 'review_requests'), request)

    // Notify reviewer
    const notificationsStore = useNotificationsStore()
    await notificationsStore.notifyReviewRequest(
      outcomeId,
      year,
      reviewerEmail,
      requesterEmail,
      requestComment
    )

    // Activity feed
    await addDoc(collection(db, 'activity_feed'), {
      user: requesterEmail,
      action: 'a demandé une review',
      detail: `${outcomeId} (${year}) à ${reviewerEmail.split('@')[0]}`,
      date: Date.now()
    })

    success('Demande de review envoyée')
  }

  const approveReview = async (requestId: string, comment?: string) => {
    const authStore = useAuthStore()
    const reviewerEmail = authStore.currentUser?.email || ''
    const request = reviewRequests.value.find(r => r.id === requestId)
    if (!request) return

    await updateDoc(doc(db, 'review_requests', requestId), {
      status: 'approved',
      resolvedAt: Date.now(),
      ...(comment && { comment })
    })

    // Update LO status to validated
    const competencesStore = useCompetencesStore()
    await competencesStore.updateStatus(request.outcomeId, request.year, 'validated')

    // Notify requester
    const notificationsStore = useNotificationsStore()
    await notificationsStore.notifyReviewResult(
      request.outcomeId,
      request.year,
      'approved',
      request.requestedBy,
      reviewerEmail,
      comment
    )

    // Activity feed
    await addDoc(collection(db, 'activity_feed'), {
      user: reviewerEmail,
      action: 'a approuvé la review',
      detail: `${request.outcomeId} (${request.year})`,
      date: Date.now()
    })

    success('Review approuvée')
  }

  const rejectReview = async (requestId: string, comment: string) => {
    const authStore = useAuthStore()
    const reviewerEmail = authStore.currentUser?.email || ''
    const request = reviewRequests.value.find(r => r.id === requestId)
    if (!request) return

    await updateDoc(doc(db, 'review_requests', requestId), {
      status: 'rejected',
      resolvedAt: Date.now(),
      comment
    })

    // Update LO status to draft
    const competencesStore = useCompetencesStore()
    await competencesStore.updateStatus(request.outcomeId, request.year, 'draft')

    // Notify requester
    const notificationsStore = useNotificationsStore()
    await notificationsStore.notifyReviewResult(
      request.outcomeId,
      request.year,
      'rejected',
      request.requestedBy,
      reviewerEmail,
      comment
    )

    // Activity feed
    await addDoc(collection(db, 'activity_feed'), {
      user: reviewerEmail,
      action: 'a rejeté la review',
      detail: `${request.outcomeId} (${request.year}) : ${comment}`,
      date: Date.now()
    })

    success('Review rejetée')
  }

  const cleanup = () => {
    if (unsubscribeReviewer) {
      unsubscribeReviewer()
      unsubscribeReviewer = null
    }
    if (unsubscribeRequester) {
      unsubscribeRequester()
      unsubscribeRequester = null
    }
    initialized = false
  }

  return {
    reviewRequests,
    loading,
    pendingForMe,
    myRequests,
    pendingCount,
    getReviewForOutcome,
    loadReviewRequests,
    createReviewRequest,
    approveReview,
    rejectReview,
    cleanup
  }
}
