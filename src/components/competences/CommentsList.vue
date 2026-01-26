<template>
  <div>
    <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
      <i class="ph ph-chat-dots"></i>
      Commentaires ({{ outcome.comments?.length || 0 }})
    </h4>

    <!-- Comments List -->
    <div class="space-y-3 mb-4">
      <div
        v-for="(comment, index) in outcome.comments"
        :key="index"
        class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <UserAvatar :email="comment.author" :size="32" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-sm text-gray-900 dark:text-white">
                {{ comment.author.split('@')[0] }}
              </span>
              <span v-if="comment.year" class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs rounded">
                {{ comment.year }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(comment.date) }}
              </span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ comment.text }}</p>
          </div>
          <button
            v-if="comment.author === authStore.currentUser?.email"
            @click="removeComment(index)"
            class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition"
          >
            <i class="ph ph-trash text-sm"></i>
          </button>
        </div>
      </div>

      <div v-if="!outcome.comments || outcome.comments.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
        <i class="ph ph-chat-slash text-3xl mb-2"></i>
        <p class="text-sm">Aucun commentaire</p>
      </div>
    </div>

    <!-- Add Comment Form -->
    <div v-if="addingComment" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
      <select
        v-model="newComment.year"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option :value="undefined">Commentaire général</option>
        <option value="L1">Spécifique à L1</option>
        <option value="L2">Spécifique à L2</option>
        <option value="L3">Spécifique à L3</option>
      </select>
      <textarea
        v-model="newComment.text"
        placeholder="Votre commentaire..."
        rows="3"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
      ></textarea>
      <div class="flex gap-2">
        <button
          @click="saveComment"
          :disabled="!newComment.text.trim()"
          class="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm rounded transition"
        >
          Ajouter
        </button>
        <button
          @click="cancelAdd"
          class="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded transition"
        >
          Annuler
        </button>
      </div>
    </div>

    <button
      v-else
      @click="addingComment = true"
      class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-center gap-2"
    >
      <i class="ph ph-plus"></i>
      <span>Ajouter un commentaire</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { formatDate } from '@/utils/helpers'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { LearningOutcome, YearLevel } from '@/types'

interface Props {
  outcome: LearningOutcome
}

const props = defineProps<Props>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()

const addingComment = ref(false)
const newComment = ref<{ text: string; year?: YearLevel }>({
  text: '',
  year: undefined
})

const saveComment = async () => {
  if (!newComment.value.text.trim()) return

  await competencesStore.addComment(props.outcome.id, newComment.value.text, newComment.value.year)
  cancelAdd()
}

const cancelAdd = () => {
  addingComment.value = false
  newComment.value = { text: '', year: undefined }
}

const removeComment = async (index: number) => {
  if (confirm('Supprimer ce commentaire ?')) {
    await competencesStore.removeComment(props.outcome.id, index)
  }
}
</script>
