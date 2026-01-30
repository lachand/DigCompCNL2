<template>
  <div class="space-y-6 theme-bg">
    <!-- Header -->
    <div class="flex items-center justify-between theme-surface">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Quêtes & Défis</h2>
        <p class="text-gray-600 dark:text-gray-400">Accomplissez des missions pour gagner des récompenses</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
          {{ userInventory?.currency.points || 0 }} points
        </div>
      </div>
    </div>

    <!-- Navigation tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 theme-surface">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 font-medium text-sm border-b-2 transition',
          activeTab === tab.id
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
        ]"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Quests Tab -->
    <div v-if="activeTab === 'quests'" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="questData in availableQuests"
          :key="questData.quest.id"
          class="card-theme rounded-lg p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ questData.quest.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ questData.quest.description }}</p>
            </div>
            <div class="ml-2">
              <span :class="getQuestTypeColor(questData.quest.type)" class="px-2 py-1 text-xs rounded-full">
                {{ getQuestTypeLabel(questData.quest.type) }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="requirement in questData.quest.requirements"
              :key="requirement.actionType"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-gray-600 dark:text-gray-400">{{ getActionLabel(requirement.actionType) }}</span>
              <span class="font-medium">
                {{ questData.progress[requirement.actionType] || 0 }}/{{ requirement.count }}
              </span>
            </div>
          </div>

          <div class="mt-4">
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${getQuestProgress(questData)}%` }"
              ></div>
            </div>
            <div class="flex justify-between items-center mt-2">
              <span class="text-xs text-gray-500">{{ Math.round(getQuestProgress(questData)) }}% terminé</span>
              <span class="text-xs font-medium text-green-600 dark:text-green-400">
                +{{ questData.quest.rewards.points }} pts
              </span>
            </div>
          </div>

          <!-- Start quest button if not started -->
          <div v-if="!questData.isStarted" class="mt-4">
            <button
              @click="startQuest(questData.quest.id)"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition"
            >
              Commencer la quête
            </button>
          </div>
        </div>
      </div>

      <!-- Completed quests -->
      <div v-if="completedQuests.length > 0" class="mt-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Récompenses à réclamer</h3>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="userQuest in completedQuests"
            :key="userQuest.id"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-semibold text-green-800 dark:text-green-200">{{ getQuest(userQuest.questId)?.title }}</h4>
                <p class="text-sm text-green-600 dark:text-green-400">Terminée ! 🎉</p>
              </div>
              <button
                v-if="userQuest.id"
                @click="claimReward(userQuest.id)"
                class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition"
              >
                Réclamer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Challenges Tab -->
    <div v-if="activeTab === 'challenges'" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="challenge in activeChallenges"
          :key="challenge.id"
          class="card-theme rounded-lg p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ challenge.title }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ challenge.description }}</p>
            </div>
            <div class="ml-2">
              <span :class="getChallengeTypeColor(challenge.type)" class="px-2 py-1 text-xs rounded-full">
                {{ challenge.type === 'individual' ? 'Solo' : 'Équipe' }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span>{{ challenge.participants.length }} participant(s)</span>
            <span>{{ formatTimeLeft(challenge.endDate) }}</span>
          </div>

          <div class="space-y-2">
            <div
              v-for="requirement in challenge.requirements"
              :key="requirement.actionType"
              class="text-sm"
            >
              <span class="text-gray-600 dark:text-gray-400">{{ getActionLabel(requirement.actionType) }}: </span>
              <span class="font-medium">{{ requirement.count }}</span>
              <span class="text-xs text-gray-500">en {{ requirement.timeframe }}h</span>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs font-medium text-green-600 dark:text-green-400">
              +{{ challenge.rewards.points }} pts
            </span>
            <button
              v-if="!challenge.participants.includes(authStore.currentUser?.uid || '')"
              @click="joinChallenge(challenge.id)"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition"
            >
              Rejoindre
            </button>
            <span v-else class="text-sm text-green-600 dark:text-green-400 font-medium">
              Participates
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Shop Tab -->
    <div v-if="activeTab === 'shop'" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="item in availableShopItems"
          :key="item.id"
          class="card-theme rounded-lg p-4"
        >
          <div class="text-center mb-3">
            <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <i v-if="item.category === 'avatar'" class="ph ph-user-circle text-2xl text-indigo-500"></i>
              <i v-else-if="item.category === 'badge'" class="ph ph-medal text-2xl text-yellow-500"></i>
              <i v-else-if="item.category === 'utility' && (item.id.includes('protection') || item.name.toLowerCase().includes('protecteur'))" class="ph ph-shield text-2xl text-green-500"></i>
              <i v-else-if="item.category === 'effect' && (item.id.includes('xp') || item.id.includes('multiplier') || item.name.toLowerCase().includes('multiplicateur'))" class="ph ph-trend-up text-2xl text-pink-500"></i>
              <i v-else-if="item.category === 'theme' && item.id.includes('premium')" class="ph ph-paint-brush-broad text-2xl text-amber-500"></i>
              <i v-else-if="item.category === 'theme'" class="ph ph-palette text-2xl text-blue-500"></i>
              <i v-else class="ph ph-shopping-bag text-xl text-gray-600 dark:text-gray-400"></i>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ item.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ item.description }}</p>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ item.price }} pts</span>
            <div class="flex items-center gap-2">
              <button
                v-if="!(item.category === 'utility' && (item.id.includes('protection') || item.id.includes('xp') || item.id.includes('multiplier')))"
                @click="purchaseItem(item.id)"
                :disabled="
                  ((userInventory?.currency.points || 0) < item.price) ||
                  (
                    (item.category === 'avatar' || item.category === 'badge' || item.isLimited || item.category === 'theme')
                    && userInventory?.items?.some(i => i.itemId === item.id)
                  )
                "
                class="px-3 py-1 rounded text-sm font-medium transition"
                :class="[
                  ((userInventory?.currency.points || 0) >= item.price) && !((item.category === 'avatar' || item.category === 'badge' || item.isLimited) && userInventory?.items?.some(i => i.itemId === item.id))
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                ]"
              >
                <span v-if="(item.category === 'avatar' || item.category === 'badge' || item.isLimited || item.category === 'theme') && userInventory?.items?.some(i => i.itemId === item.id)">
                  Déjà possédé
                </span>
                <span v-else>Acheter</span>
              </button>
              <button
                v-else
                @click="activateBonus(item.id)"
                class="px-3 py-1 rounded text-sm font-medium transition bg-green-600 hover:bg-green-700 text-white"
              >
                Activer
              </button>
              <span v-if="item.category === 'utility'">
                <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  x{{ userInventory?.items?.filter(i => i.itemId === item.id).length || 0 }}
                </span>
              </span>
            </div>
          </div>

          <div v-if="item.isLimited && item.stock" class="mt-2 text-xs text-orange-600 dark:text-orange-400">
            Stock limité: {{ item.stock }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useExtendedGamificationStore } from '@/stores/extendedGamification'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const store = useExtendedGamificationStore()

const activeTab = ref('quests')

const tabs = [
  { id: 'quests', name: 'Quêtes' },
  { id: 'challenges', name: 'Défis' },
  { id: 'shop', name: 'Boutique' }
]

// Computed
const completedQuests = computed(() => store.completedQuests)
const activeChallenges = computed(() => store.activeChallenges)
const availableShopItems = computed(() => store.availableShopItems)
const userInventory = computed(() => store.userInventory)
const userQuests = computed(() => store.userQuests)

// Available quests (all active quests, whether user started them or not)
const availableQuests = computed(() => {
  return store.activeQuests.map(quest => {
    const userQuest = userQuests.value.find(uq => uq.questId === quest.id)
    return {
      quest,
      userQuest,
      isStarted: !!userQuest,
      progress: userQuest?.progress || {}
    }
  })
})

// Methods
const getQuest = (questId: string) => {
  return store.quests.find(q => q.id === questId)
}

const getQuestProgress = (questData: any) => {
  const quest = questData.quest
  if (!quest) return 0

  const totalRequirements = quest.requirements.length
  let completedRequirements = 0

  for (const req of quest.requirements) {
    if ((questData.progress[req.actionType] || 0) >= req.count) {
      completedRequirements++
    }
  }

  return (completedRequirements / totalRequirements) * 100
}

const getQuestTypeColor = (type?: string) => {
  switch (type) {
    case 'daily': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'weekly': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'monthly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'special': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getQuestTypeLabel = (type?: string) => {
  switch (type) {
    case 'daily': return 'Quotidienne'
    case 'weekly': return 'Hebdomadaire'
    case 'monthly': return 'Mensuelle'
    case 'special': return 'Spéciale'
    default: return 'Inconnue'
  }
}

const getChallengeTypeColor = (type: string) => {
  return type === 'individual'
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
}

const getActionLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    'statusChange': 'Changer le statut',
    'validation': 'Valider un LO',
    'review': 'Faire une review',
    'comment': 'Poster un commentaire',
    'resource': 'Ajouter une ressource',
    'assignment': 'Assigner une tâche',
    'login': 'Se connecter',
    'learning': 'Apprendre une compétence'
  }
  return labels[actionType] || actionType
}

const formatTimeLeft = (endDate: number) => {
  const now = Date.now()
  const diff = endDate - now

  if (diff <= 0) return 'Terminé'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}j ${hours % 24}h`
  return `${hours}h restantes`
}

const claimReward = async (userQuestId: string) => {
  await store.claimQuestReward(userQuestId)
}


const purchaseItem = async (itemId: string) => {
  await store.purchaseItem(itemId)
}

const activateBonus = async (itemId: string) => {
  await store.activateBonus(itemId)
}

const joinChallenge = async (challengeId: string) => {
  await store.joinChallenge(challengeId)
}

const startQuest = async (questId: string) => {
  await store.startQuest(questId)
}

onMounted(() => {
  store.initializeListeners()
})

onUnmounted(() => {
  store.cleanup()
})
</script>