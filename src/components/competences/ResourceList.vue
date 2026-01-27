<template>
  <div
    @dragover.prevent="onDragOver"
    @dragenter.prevent="onDragEnter"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
    class="transition-all duration-200 rounded-lg"
    :class="isDragOver ? 'ring-2 ring-indigo-400 ring-dashed bg-indigo-50 dark:bg-indigo-900/20' : ''"
  >
    <div class="flex items-center justify-between mb-2">
      <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Ressources ({{ resources.length }})
      </h5>
      <div class="flex gap-1">
        <button
          @click="showHunter = true"
          class="p-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          title="Chercher des ressources"
        >
          <i class="ph ph-magnifying-glass"></i>
        </button>
        <button
          @click="addingResource = true"
          class="p-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          title="Ajouter une ressource"
        >
          <i class="ph ph-plus"></i>
        </button>
      </div>
    </div>

    <!-- Drop Zone Hint -->
    <div
      v-if="isDragOver"
      class="flex items-center justify-center gap-2 py-4 mb-2 border-2 border-dashed border-indigo-400 rounded-lg text-indigo-600 dark:text-indigo-400 text-sm"
    >
      <i class="ph ph-upload-simple text-lg"></i>
      Déposer ici
    </div>

    <!-- Resource Items -->
    <div class="space-y-2">
      <div
        v-for="(resource, index) in resources"
        :key="index"
        draggable="true"
        @dragstart="onItemDragStart($event, index)"
        @dragend="onItemDragEnd"
        @dragover.prevent.stop="onItemDragOver(index)"
        class="group flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
        :class="[
          dragItemIndex === index ? 'opacity-40' : '',
          dropTargetIndex === index ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''
        ]"
      >
        <i class="ph ph-dots-six-vertical text-gray-400 dark:text-gray-500 cursor-grab flex-shrink-0 mt-1"></i>
        <i class="ph text-lg flex-shrink-0 mt-0.5" :class="resourceIcon(resource.type)"></i>
        <div class="flex-1 min-w-0">
          <a
            :href="resource.url"
            target="_blank"
            class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline block truncate"
          >
            {{ resource.title }}
          </a>
          <div v-if="resource.aiAnalysis" class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span v-if="resource.aiAnalysis.duration">
              <i class="ph ph-clock"></i>
              {{ resource.aiAnalysis.duration }}
            </span>
            <span v-if="resource.aiAnalysis.tags" class="truncate">
              {{ resource.aiAnalysis.tags.join(', ') }}
            </span>
          </div>
        </div>
        <button
          @click="removeResource(index)"
          class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition"
        >
          <i class="ph ph-trash text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Add Resource Form -->
    <div v-if="addingResource" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
      <input
        v-model="newResource.title"
        type="text"
        placeholder="Titre"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
      <input
        v-model="newResource.url"
        type="url"
        placeholder="URL"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
      <select
        v-model="newResource.type"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="video">Vidéo</option>
        <option value="document">Document</option>
        <option value="file">Fichier</option>
      </select>
      <div class="flex gap-2">
        <button
          @click="saveResource"
          :disabled="!canSave"
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

    <!-- Resource Hunter Modal -->
    <ResourceHunter
      v-if="showHunter"
      :outcome-id="outcomeId"
      :year="year"
      @close="showHunter = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import ResourceHunter from './ResourceHunter.vue'
import type { Resource, ResourceType, YearLevel } from '@/types'

interface Props {
  resources: Resource[]
  outcomeId: string
  year: YearLevel
}

const props = defineProps<Props>()

const competencesStore = useCompetencesStore()

const addingResource = ref(false)
const showHunter = ref(false)
const isDragOver = ref(false)
const dragItemIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)
let dragEnterCount = 0

const newResource = ref<{ title: string; url: string; type: ResourceType }>({
  title: '',
  url: '',
  type: 'document'
})

const canSave = computed(() => {
  return newResource.value.title.trim() && newResource.value.url.trim()
})

const resourceIcon = (type?: ResourceType) => {
  const icons = {
    video: 'ph-video-camera',
    document: 'ph-file-text',
    file: 'ph-file'
  }
  return icons[type || 'document']
}

// --- External drag & drop (files / URLs) ---

const detectTypeFromExtension = (filename: string): ResourceType => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'ogv']
  if (videoExts.includes(ext)) return 'video'
  const docExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'txt', 'md']
  if (docExts.includes(ext)) return 'document'
  return 'file'
}

const detectTypeFromUrl = (url: string): ResourceType => {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('youtube') || hostname.includes('youtu.be') || hostname.includes('vimeo') || hostname.includes('dailymotion')) {
      return 'video'
    }
  } catch {}
  return detectTypeFromExtension(url)
}

const extractTitleFromUrl = (url: string): string => {
  try {
    const u = new URL(url)
    const path = u.pathname.split('/').filter(Boolean).pop()
    if (path) {
      return decodeURIComponent(path).replace(/[-_]/g, ' ').replace(/\.\w+$/, '')
    }
    return u.hostname
  } catch {
    return url.substring(0, 50)
  }
}

const onDragOver = (e: DragEvent) => {
  if (dragItemIndex.value !== null) return // internal reorder
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const onDragEnter = (e: DragEvent) => {
  if (dragItemIndex.value !== null) return
  dragEnterCount++
  isDragOver.value = true
}

const onDragLeave = () => {
  if (dragItemIndex.value !== null) return
  dragEnterCount--
  if (dragEnterCount <= 0) {
    isDragOver.value = false
    dragEnterCount = 0
  }
}

const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  dragEnterCount = 0

  // Handle internal reorder
  if (dragItemIndex.value !== null && dropTargetIndex.value !== null) {
    if (dragItemIndex.value !== dropTargetIndex.value) {
      competencesStore.reorderResources(props.outcomeId, props.year, dragItemIndex.value, dropTargetIndex.value)
    }
    dragItemIndex.value = null
    dropTargetIndex.value = null
    return
  }

  if (!e.dataTransfer) return

  // Handle file drop
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    const type = detectTypeFromExtension(file.name)
    newResource.value = {
      title: file.name.replace(/\.\w+$/, ''),
      url: '',
      type
    }
    addingResource.value = true
    return
  }

  // Handle URL drop
  const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    const type = detectTypeFromUrl(url)
    newResource.value = {
      title: extractTitleFromUrl(url),
      url,
      type
    }
    addingResource.value = true
  }
}

// --- Internal reorder ---

const onItemDragStart = (e: DragEvent, index: number) => {
  dragItemIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

const onItemDragEnd = () => {
  dragItemIndex.value = null
  dropTargetIndex.value = null
}

const onItemDragOver = (index: number) => {
  if (dragItemIndex.value === null) return
  dropTargetIndex.value = index
}

// --- Save / Remove ---

const saveResource = async () => {
  if (!canSave.value) return

  await competencesStore.addResource(props.outcomeId, props.year, {
    title: newResource.value.title,
    url: newResource.value.url,
    type: newResource.value.type
  })

  cancelAdd()
}

const cancelAdd = () => {
  addingResource.value = false
  newResource.value = { title: '', url: '', type: 'document' }
}

const removeResource = async (index: number) => {
  if (confirm('Supprimer cette ressource ?')) {
    await competencesStore.removeResource(props.outcomeId, props.year, index)
  }
}
</script>
