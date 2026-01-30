import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  setDoc
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'
import { useToast } from '@/composables/useToast'

export interface Quest {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'special'
  category: 'learning' | 'collaboration' | 'creation' | 'review'
  requirements: {
    actionType: string
    count: number
    target?: string
  }[]
  rewards: {
    points: number
    experience?: number
    badge?: string
    item?: string
  }
  isActive: boolean
  startDate: number
  endDate: number
  maxCompletions?: number
}

export interface UserQuest {
  id?: string
  questId: string
  userId: string
  progress: Record<string, number>
  completed: boolean
  completedAt?: number
  claimed: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  type: 'individual' | 'team'
  category: 'learning' | 'collaboration' | 'creation'
  requirements: {
    actionType: string
    count: number
    timeframe: number // in hours
  }[]
  rewards: {
    points: number
    experience?: number
    badge?: string
    item?: string
  }
  participants: string[] // user IDs
  teams?: string[][] // array of team arrays
  startDate: number
  endDate: number
  isActive: boolean
  winner?: string | string[] // user ID(s)
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: 'theme' | 'avatar' | 'badge' | 'effect' | 'utility'
  price: number
  image?: string
  isLimited: boolean
  stock?: number
  isActive: boolean
}

export interface UserInventory {
  userId: string
  items: {
    itemId: string
    purchasedAt: number
    equipped?: boolean
  }[]
  currency: {
    points: number
    premiumPoints?: number
  }
}

export const useExtendedGamificationStore = defineStore('extendedGamification', () => {
  const authStore = useAuthStore()
  const { success, error } = useToast()

  // State
  const quests = ref<Quest[]>([])
  const userQuests = ref<UserQuest[]>([])
  const challenges = ref<Challenge[]>([])
  const shopItems = ref<ShopItem[]>([])
  const userInventory = ref<UserInventory | null>(null)
  const loading = ref(false)

  // Listeners
  let questsUnsubscribe: Unsubscribe | null = null
  let userQuestsUnsubscribe: Unsubscribe | null = null
  let challengesUnsubscribe: Unsubscribe | null = null
  let shopUnsubscribe: Unsubscribe | null = null
  let inventoryUnsubscribe: Unsubscribe | null = null

  // Computed
  const activeQuests = computed(() => {
    const now = Date.now()
    return quests.value.filter(q => q.isActive && q.startDate <= now && q.endDate >= now)
  })

  const userActiveQuests = computed(() => {
    return userQuests.value.filter(uq => {
      const quest = quests.value.find(q => q.id === uq.questId)
      return quest && quest.isActive && !uq.completed
    })
  })

  const completedQuests = computed(() => {
    return userQuests.value.filter(uq => uq.completed && !uq.claimed)
  })

  const activeChallenges = computed(() => {
    const now = Date.now()
    return challenges.value.filter(c => c.isActive && c.startDate <= now && c.endDate >= now)
  })

  const availableShopItems = computed(() => {
    return shopItems.value.filter(item => item.isActive && (!item.isLimited || (item.stock && item.stock > 0)))
  })

  // Actions
  const initializeListeners = () => {
    if (!authStore.currentUser) return

    // Quests listener
    if (!questsUnsubscribe) {
      const questsQuery = query(
        collection(db, 'quests'),
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      )
      questsUnsubscribe = onSnapshot(questsQuery, (snapshot) => {
        quests.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quest[]
      })
    }

    // User quests listener
    if (!userQuestsUnsubscribe) {
      const userQuestsQuery = query(
        collection(db, 'userQuests'),
        where('userId', '==', authStore.currentUser!.uid)
      )
      userQuestsUnsubscribe = onSnapshot(userQuestsQuery, (snapshot) => {
        userQuests.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserQuest[]
      })
    }

    // Challenges listener
    if (!challengesUnsubscribe) {
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      )
      challengesUnsubscribe = onSnapshot(challengesQuery, (snapshot) => {
        challenges.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Challenge[]
      })
    }

    // Shop items listener
    if (!shopUnsubscribe) {
      const shopQuery = query(
        collection(db, 'shopItems'),
        where('isActive', '==', true),
        orderBy('category')
      )
      shopUnsubscribe = onSnapshot(shopQuery, (snapshot) => {
        shopItems.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ShopItem[]
      })
    }

    // User inventory listener
    if (!inventoryUnsubscribe) {
      const inventoryRef = doc(db, 'userInventories', authStore.currentUser!.uid)
      inventoryUnsubscribe = onSnapshot(inventoryRef, (doc) => {
        if (doc.exists()) {
          userInventory.value = {
            userId: doc.id,
            ...doc.data()
          } as UserInventory
        } else {
          // Initialize empty inventory
          userInventory.value = {
            userId: authStore.currentUser!.uid,
            items: [],
            currency: { points: 0 }
          }
        }
      })
    }
  }

  const cleanup = () => {
    if (questsUnsubscribe) {
      questsUnsubscribe()
      questsUnsubscribe = null
    }
    if (userQuestsUnsubscribe) {
      userQuestsUnsubscribe()
      userQuestsUnsubscribe = null
    }
    if (challengesUnsubscribe) {
      challengesUnsubscribe()
      challengesUnsubscribe = null
    }
    if (shopUnsubscribe) {
      shopUnsubscribe()
      shopUnsubscribe = null
    }
    if (inventoryUnsubscribe) {
      inventoryUnsubscribe()
      inventoryUnsubscribe = null
    }
  }

  const updateQuestProgress = async (actionType: string, count: number = 1) => {
    if (!authStore.currentUser) return

    for (const quest of activeQuests.value) {
      const userQuest = userQuests.value.find(uq => uq.questId === quest.id)
      if (!userQuest || userQuest.completed) continue

      let progressUpdated = false
      for (const requirement of quest.requirements) {
        if (requirement.actionType === actionType) {
          const currentProgress = userQuest.progress[requirement.actionType] || 0
          const newProgress = Math.min(currentProgress + count, requirement.count)
          userQuest.progress[requirement.actionType] = newProgress
          progressUpdated = true
        }
      }

      if (progressUpdated) {
        // Check if quest is completed
        const isCompleted = quest.requirements.every(req =>
          (userQuest.progress[req.actionType] || 0) >= req.count
        )

        if (isCompleted) {
          userQuest.completed = true
          userQuest.completedAt = Date.now()
          success(`Quête "${quest.title}" terminée ! 🎉`)
        }

        // Update in Firestore
        if (userQuest.id) {
          await updateDoc(doc(db, 'userQuests', userQuest.id), {
            progress: userQuest.progress,
            completed: userQuest.completed,
            completedAt: userQuest.completedAt
          })
        }
      }
    }
  }

  const claimQuestReward = async (userQuestId: string) => {
    const userQuest = userQuests.value.find(uq => uq.id === userQuestId)
    if (!userQuest || !userQuest.id || !userQuest.completed || userQuest.claimed) return

    const quest = quests.value.find(q => q.id === userQuest.questId)
    if (!quest) return

    try {
      // Add rewards to user
      if (quest.rewards.points > 0) {
        await addPoints(quest.rewards.points)
      }

      // Mark as claimed
      await updateDoc(doc(db, 'userQuests', userQuestId), {
        claimed: true
      })

      success(`Récompense de ${quest.rewards.points} points réclamée !`)
    } catch (err) {
      console.error('Erreur lors de la réclamation de la récompense:', err)
    }
  }

  const addPoints = async (points: number) => {
    if (!authStore.currentUser || !userInventory.value) return

    const newPoints = (userInventory.value.currency.points || 0) + points
    await updateDoc(doc(db, 'userInventories', authStore.currentUser.uid), {
      'currency.points': newPoints
    })
  }

  const purchaseItem = async (itemId: string) => {
    if (!authStore.currentUser || !userInventory.value) return

    const item = shopItems.value.find(i => i.id === itemId)
    if (!item) return

    const currentPoints = userInventory.value.currency.points || 0
    if (currentPoints < item.price) {
      error('Points insuffisants !')
      return
    }

    try {
      // Deduct points
      const newPoints = currentPoints - item.price
      await updateDoc(doc(db, 'userInventories', authStore.currentUser.uid), {
        'currency.points': newPoints,
        items: [...userInventory.value.items, {
          itemId,
          purchasedAt: Date.now()
        }]
      })

      success(`Article "${item.name}" acheté !`)
    } catch (err) {
      console.error('Erreur lors de l\'achat:', err)
    }
  }

  const joinChallenge = async (challengeId: string) => {
    if (!authStore.currentUser) return

    const challenge = challenges.value.find(c => c.id === challengeId)
    if (!challenge || challenge.participants.includes(authStore.currentUser!.uid)) return

    try {
      await updateDoc(doc(db, 'challenges', challengeId), {
        participants: [...challenge.participants, authStore.currentUser!.uid]
      })
      success('Vous avez rejoint le défi !')
    } catch (err) {
      console.error('Erreur lors de l\'inscription au défi:', err)
    }
  }

  const startQuest = async (questId: string) => {
    if (!authStore.currentUser) return

    // Vérifier si l'utilisateur a déjà commencé cette quête
    const existingUserQuest = userQuests.value.find(uq => uq.questId === questId && uq.userId === authStore.currentUser!.uid)
    if (existingUserQuest) return

    try {
      const newUserQuest: UserQuest = {
        questId,
        userId: authStore.currentUser!.uid,
        progress: {},
        completed: false,
        claimed: false
      }

      const docRef = doc(collection(db, 'userQuests'))
      await setDoc(docRef, newUserQuest)

      success('Quête commencée !')
    } catch (err) {
      console.error('Erreur lors du démarrage de la quête:', err)
    }
  }

  return {
    // State
    quests,
    userQuests,
    challenges,
    shopItems,
    userInventory,
    loading,

    // Computed
    activeQuests,
    userActiveQuests,
    completedQuests,
    activeChallenges,
    availableShopItems,

    // Actions
    initializeListeners,
    cleanup,
    updateQuestProgress,
    claimQuestReward,
    addPoints,
    purchaseItem,
    joinChallenge,
    startQuest
  }
})