import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'

export interface NewsItem {
  id: string
  title: string
  content: string
  date: number
  isActive: boolean
}

export const useNewsStore = defineStore('news', () => {
  const news = ref<NewsItem[]>([])
  const userReadNews = ref<string[]>([])
  const loading = ref(false)

  let newsUnsubscribe: Unsubscribe | null = null
  let userReadUnsubscribe: Unsubscribe | null = null

  const authStore = useAuthStore()

  const unreadNews = computed(() => {
    return news.value
      .filter(item => item.isActive && !userReadNews.value.includes(item.id))
      .sort((a, b) => b.date - a.date)
  })

  const initializeNews = () => {
    if (newsUnsubscribe) return

    // Écouter les nouveautés actives
    const newsQuery = query(
      collection(db, 'news'),
      where('isActive', '==', true),
      orderBy('date', 'desc')
    )

    newsUnsubscribe = onSnapshot(newsQuery, (snapshot) => {
      news.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[]
    })
  }

  const initializeUserReadNews = () => {
    if (!authStore.currentUser || userReadUnsubscribe) return

    // Écouter les nouveautés lues par l'utilisateur
    const userReadRef = doc(db, 'users', authStore.currentUser.uid)
    userReadUnsubscribe = onSnapshot(userReadRef, (doc) => {
      const data = doc.data()
      userReadNews.value = data?.readNews || []
    })
  }

  const markNewsAsRead = async (newsId: string) => {
    if (!authStore.currentUser) return

    const userRef = doc(db, 'users', authStore.currentUser.uid)
    const currentReadNews = [...userReadNews.value]

    if (!currentReadNews.includes(newsId)) {
      currentReadNews.push(newsId)
      await updateDoc(userRef, {
        readNews: currentReadNews
      })
    }
  }

  const addNews = async (title: string, content: string) => {
    await addDoc(collection(db, 'news'), {
      title,
      content,
      date: Date.now(),
      isActive: true
    })
  }

  const cleanup = () => {
    if (newsUnsubscribe) {
      newsUnsubscribe()
      newsUnsubscribe = null
    }
    if (userReadUnsubscribe) {
      userReadUnsubscribe()
      userReadUnsubscribe = null
    }
  }

  // Initialiser quand l'utilisateur se connecte
  watch(() => authStore.currentUser, (user) => {
    if (user) {
      initializeNews()
      initializeUserReadNews()
    } else {
      cleanup()
      news.value = []
      userReadNews.value = []
    }
  }, { immediate: true })

  return {
    news,
    userReadNews,
    loading,
    unreadNews,
    markNewsAsRead,
    addNews,
    cleanup
  }
})