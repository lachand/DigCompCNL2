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
  getDocs,
  getDoc,
  Unsubscribe,
  setDoc
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'
import { useToast } from '@/composables/useToast'
import { createDelayedListener, getOptimizedDelay, logOptimization } from '@/composables/useOptimizedDelays'

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

    const delay = getOptimizedDelay('GAMIFICATION')
    logOptimization('Extended Gamification', delay)

    // Quests listener avec délai
    if (!questsUnsubscribe) {
      const questsQuery = query(
        collection(db, 'quests'),
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      )
      
      const fetchQuests = async () => {
        try {
          const snapshot = await getDocs(questsQuery)
          quests.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Quest[]
        } catch (err) {
          console.error('Error fetching quests:', err)
        }
      }
      
      // Premier chargement immédiat
      fetchQuests()
      
      const questsCleanup = createDelayedListener(fetchQuests, delay, false)
      questsUnsubscribe = questsCleanup
    }

    // User quests listener avec délai plus court (plus important pour l'utilisateur)
    if (!userQuestsUnsubscribe) {
      const userQuestsQuery = query(
        collection(db, 'userQuests'),
        where('userId', '==', authStore.currentUser!.uid)
      )
      
      const fetchUserQuests = async () => {
        try {
          const snapshot = await getDocs(userQuestsQuery)
          userQuests.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserQuest[]
        } catch (err) {
          console.error('Error fetching user quests:', err)
        }
      }
      
      // Premier chargement immédiat
      fetchUserQuests()
      
      // Délai plus court pour les quêtes de l'utilisateur
      const userQuestsDelay = Math.max(30000, delay / 3) // 30s minimum
      const userQuestsCleanup = createDelayedListener(fetchUserQuests, userQuestsDelay, false)
      userQuestsUnsubscribe = userQuestsCleanup
    }

    // Challenges listener avec délai
    if (!challengesUnsubscribe) {
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('isActive', '==', true),
        orderBy('startDate', 'desc')
      )
      
      const fetchChallenges = async () => {
        try {
          const snapshot = await getDocs(challengesQuery)
          challenges.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Challenge[]
        } catch (err) {
          console.error('Error fetching challenges:', err)
        }
      }
      
      // Premier chargement immédiat
      fetchChallenges()
      
      const challengesCleanup = createDelayedListener(fetchChallenges, delay, false)
      challengesUnsubscribe = challengesCleanup
    }

    // Shop items listener avec délai plus long (moins critique)
    if (!shopUnsubscribe) {
      const shopQuery = query(
        collection(db, 'shopItems'),
        where('isActive', '==', true),
        orderBy('category')
      )
      
      const fetchShop = async () => {
        try {
          const snapshot = await getDocs(shopQuery)
          shopItems.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ShopItem[]
        } catch (err) {
          console.error('Error fetching shop items:', err)
        }
      }
      
      // Premier chargement immédiat
      fetchShop()
      
      // Délai plus long pour les objets de boutique
      const shopDelay = getOptimizedDelay('SHOP_ITEMS') // 5min
      const shopCleanup = createDelayedListener(fetchShop, shopDelay, false)
      shopUnsubscribe = shopCleanup
    }

    // User inventory listener avec polling optimisé (1min)
    if (!inventoryUnsubscribe) {
      const inventoryRef = doc(db, 'userInventories', authStore.currentUser!.uid)
      
      const fetchInventory = async () => {
        try {
          const docSnap = await getDoc(inventoryRef)
          if (docSnap.exists()) {
            userInventory.value = {
              userId: docSnap.id,
              ...docSnap.data()
            } as UserInventory
          } else {
            // Initialize empty inventory in Firestore
            const newInventory = {
              userId: authStore.currentUser!.uid,
              items: [],
              currency: { points: 0 }
            }
            await setDoc(inventoryRef, newInventory)
            userInventory.value = newInventory as UserInventory
          }
        } catch (err) {
          console.error('Error fetching inventory:', err)
        }
      }
      
      // Premier chargement immédiat
      fetchInventory()
      
      // Délai plus court pour l'inventaire (plus important pour l'utilisateur)
      const inventoryDelay = getOptimizedDelay('USER_INVENTORY') // 20s
      const inventoryCleanup = createDelayedListener(fetchInventory, inventoryDelay, false)
      inventoryUnsubscribe = inventoryCleanup
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
      // Appliquer le multiplicateur d'XP si actif
      let points = quest.rewards.points
      let experience = quest.rewards.experience || 0
      if (activeBonuses.value.xpMultiplier) {
        experience = experience * activeBonuses.value.xpMultiplier
        activeBonuses.value.xpMultiplier = undefined // Consommé
      }
      // Ajout des points et XP
      if (points > 0) {
        await addPoints(points)
      }
      // Ici, tu pourrais ajouter la logique pour stocker l'XP si tu as un champ XP
      // Protection: à utiliser lors d'une pénalité, non ici

      // Mark as claimed
      await updateDoc(doc(db, 'userQuests', userQuestId), {
        claimed: true
      })

      success(`Récompense de ${points} points${experience ? ' et ' + experience + ' XP' : ''} réclamée !`)
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

  // Bonus state
  const activeBonuses = ref<{ xpMultiplier?: number; protection?: boolean }>({})

  /**
   * Active a bonus item (xp multiplier, protection, etc.)
   */
  const activateBonus = async (itemId: string) => {
    if (!userInventory.value) return
    // Find the first unused item in inventory
    const idx = userInventory.value.items.findIndex(i => i.itemId === itemId && !i.equipped)
    if (idx === -1) {
      error('Aucun bonus disponible à activer !')
      return
    }
    // Mark as equipped
    userInventory.value.items[idx].equipped = true
    await updateDoc(doc(db, 'userInventories', userInventory.value.userId), {
      items: userInventory.value.items
    })
    // Set local effect
    if (itemId.includes('xp') || itemId.includes('multiplier')) {
      activeBonuses.value.xpMultiplier = 2 // ou lire la valeur du shopItem si besoin
      success('Multiplicateur d\'XP activé pour la prochaine récompense !')
    } else if (itemId.includes('protection')) {
      activeBonuses.value.protection = true
      success('Protection activée pour la prochaine pénalité !')
    }
  }

  // Initialize the store
  const init = () => {
    initializeListeners()
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
    init,
    initializeListeners,
    cleanup,
    updateQuestProgress,
    claimQuestReward,
    addPoints,
    purchaseItem,
    joinChallenge,
    startQuest,
    activateBonus,
    activeBonuses
  }
})