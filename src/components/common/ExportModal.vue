<template>
  <Modal
    v-model="isOpen"
    title="Exporter les Learning Outcomes"
    icon="ph-export"
    size="lg"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Format Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Format d'export
        </label>
        <div class="flex gap-3">
          <button
            v-for="format in formats"
            :key="format.id"
            @click="selectedFormat = format.id"
            class="flex-1 p-4 border-2 rounded-lg transition text-center"
            :class="selectedFormat === format.id
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
          >
            <i :class="[format.icon, 'text-2xl mb-2', selectedFormat === format.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500']"></i>
            <p class="font-medium text-gray-900 dark:text-white">{{ format.label }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ format.description }}</p>
          </button>
        </div>
      </div>

      <!-- Year Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Années à inclure
        </label>
        <div class="flex gap-2">
          <button
            v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
            :key="year"
            @click="toggleYear(year)"
            class="px-4 py-2 rounded-lg transition border-2"
            :class="filters.years.includes(year)
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'"
          >
            {{ year }}
          </button>
        </div>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Statuts à inclure
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="status in statuses"
            :key="status.value"
            @click="toggleStatus(status.value)"
            class="px-3 py-1.5 rounded-lg transition border text-sm"
            :class="filters.statuses.includes(status.value)
              ? `${status.bgActive} ${status.textActive} border-transparent`
              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'"
          >
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- Domain Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Domaines
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="domain in competencesStore.digCompData.domains"
            :key="domain.id"
            @click="toggleDomain(domain.id)"
            class="px-3 py-1.5 rounded-lg transition border text-sm"
            :class="filters.domains.includes(domain.id)
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'"
          >
            {{ getDomainShortName(domain) }}
          </button>
        </div>
      </div>

      <!-- Additional Filters -->
      <div class="space-y-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="filters.onlyWithCourse"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Uniquement avec lien de cours</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="filters.onlyWithResources"
            type="checkbox"
            class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Uniquement avec ressources</span>
        </label>
      </div>

      <!-- Preview Count -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">LO correspondant aux filtres :</span>
          <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ filteredOutcomes.length }}</span>
        </div>
      </div>

      <!-- Export Button -->
      <button
        @click="exportData"
        :disabled="isExporting || filteredOutcomes.length === 0"
        class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
      >
        <i v-if="!isExporting" class="ph ph-export"></i>
        <i v-else class="ph ph-spinner animate-spin"></i>
        <span>{{ isExporting ? 'Export en cours...' : `Exporter ${filteredOutcomes.length} LO en ${selectedFormat.toUpperCase()}` }}</span>
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import type { YearLevel, StatusType, LearningOutcome, ExportFilters } from '@/types'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const competencesStore = useCompetencesStore()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedFormat = ref<'pdf' | 'excel'>('excel')
const isExporting = ref(false)

const formats = [
  { id: 'excel' as const, label: 'Excel', icon: 'ph ph-file-xls', description: 'Tableur complet' },
  { id: 'pdf' as const, label: 'PDF', icon: 'ph ph-file-pdf', description: 'Document formaté' }
]

const statuses: { value: StatusType; label: string; bgActive: string; textActive: string }[] = [
  { value: 'none', label: 'Non commencé', bgActive: 'bg-gray-200 dark:bg-gray-600', textActive: 'text-gray-800 dark:text-gray-200' },
  { value: 'draft', label: 'Brouillon', bgActive: 'bg-yellow-100 dark:bg-yellow-900/30', textActive: 'text-yellow-800 dark:text-yellow-300' },
  { value: 'review', label: 'En révision', bgActive: 'bg-blue-100 dark:bg-blue-900/30', textActive: 'text-blue-800 dark:text-blue-300' },
  { value: 'validated', label: 'Validé', bgActive: 'bg-green-100 dark:bg-green-900/30', textActive: 'text-green-800 dark:text-green-300' },
  { value: 'obsolete', label: 'Obsolète', bgActive: 'bg-red-100 dark:bg-red-900/30', textActive: 'text-red-800 dark:text-red-300' }
]

const filters = reactive<ExportFilters>({
  years: ['L1', 'L2', 'L3'],
  statuses: ['none', 'draft', 'review', 'validated', 'obsolete'],
  domains: [],
  tags: [],
  onlyWithCourse: false,
  onlyWithResources: false
})

// Initialize domains
watch(() => competencesStore.digCompData.domains, (domains) => {
  if (domains.length && filters.domains.length === 0) {
    filters.domains = domains.map(d => d.id)
  }
}, { immediate: true })

const toggleYear = (year: YearLevel) => {
  const index = filters.years.indexOf(year)
  if (index === -1) {
    filters.years.push(year)
  } else if (filters.years.length > 1) {
    filters.years.splice(index, 1)
  }
}

const toggleStatus = (status: StatusType) => {
  const index = filters.statuses.indexOf(status)
  if (index === -1) {
    filters.statuses.push(status)
  } else if (filters.statuses.length > 1) {
    filters.statuses.splice(index, 1)
  }
}

const toggleDomain = (domainId: string) => {
  const index = filters.domains.indexOf(domainId)
  if (index === -1) {
    filters.domains.push(domainId)
  } else if (filters.domains.length > 1) {
    filters.domains.splice(index, 1)
  }
}

const getDomainShortName = (domain: any) => {
  const match = domain.id?.match(/\/(\d+)$/)
  if (match) {
    return `D${match[1]}: ${domain.name?.substring(0, 15) || ''}...`
  }
  return domain.name?.substring(0, 20) || domain.id
}

const filteredOutcomes = computed(() => {
  return competencesStore.allOutcomes.filter(outcome => {
    // Domain filter - find which domain this outcome belongs to
    let outcomeDomainId: string | null = null
    for (const domain of competencesStore.digCompData.domains) {
      for (const comp of domain.competences) {
        if (comp.outcomes.some(o => o.id === outcome.id)) {
          outcomeDomainId = domain.id
          break
        }
      }
      if (outcomeDomainId) break
    }

    if (outcomeDomainId && filters.domains.length > 0 && !filters.domains.includes(outcomeDomainId)) {
      return false
    }

    // Check if outcome has mappings
    if (!outcome.mappings) return filters.statuses.includes('none')

    // Check if any selected year has a matching status
    const hasMatchingStatus = filters.years.some(year => {
      const status = outcome.mappings?.[year]?.status || 'none'
      return filters.statuses.includes(status)
    })
    if (!hasMatchingStatus) return false

    // Course filter
    if (filters.onlyWithCourse) {
      const hasCourse = filters.years.some(year => outcome.mappings?.[year]?.courseLink)
      if (!hasCourse) return false
    }

    // Resources filter
    if (filters.onlyWithResources) {
      const hasResources = filters.years.some(year => (outcome.mappings?.[year]?.resources?.length || 0) > 0)
      if (!hasResources) return false
    }

    return true
  })
})

const exportData = async () => {
  isExporting.value = true

  try {
    if (selectedFormat.value === 'excel') {
      await exportToExcel()
    } else {
      await exportToPDF()
    }
    success(`Export ${selectedFormat.value.toUpperCase()} réussi`)
    isOpen.value = false
  } catch (err) {
    showError(`Erreur lors de l'export: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
  } finally {
    isExporting.value = false
  }
}

const exportToExcel = async () => {
  const data = filteredOutcomes.value.map(outcome => {
    const row: Record<string, string> = {
      'ID': outcome.id,
      'Description': outcome.description,
      'Niveau': outcome.level,
      'Tags': (outcome.tags || []).join(', '),
      'Assignés': (outcome.assignees || []).map(a => {
        if (a.startsWith('ext:')) {
          const member = authStore.externalMembers.find(m => m.id === a.replace('ext:', ''))
          return member ? `${member.firstName} ${member.lastName} (externe)` : a
        }
        return a
      }).join(', ')
    }

    filters.years.forEach(year => {
      const mapping = outcome.mappings[year]
      row[`${year} - Statut`] = mapping?.status || 'none'
      row[`${year} - Cours`] = mapping?.courseLink || ''
      row[`${year} - Ressources`] = (mapping?.resources || []).map(r => r.title).join('; ')
    })

    return row
  })

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Learning Outcomes')

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 20)
  }))
  ws['!cols'] = colWidths

  XLSX.writeFile(wb, `DigComp_LO_${new Date().toISOString().split('T')[0]}.xlsx`)
}

const exportToPDF = async () => {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('DigComp 3.0 - Learning Outcomes', 14, 20)

  doc.setFontSize(10)
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28)
  doc.text(`Années: ${filters.years.join(', ')} | Domaines: ${filters.domains.join(', ')}`, 14, 34)

  let y = 45

  for (const outcome of filteredOutcomes.value) {
    // Check if we need a new page
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    // Outcome header
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`${outcome.id} - ${outcome.level}`, 14, y)
    y += 6

    // Description
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(outcome.description, 180)
    doc.text(descLines, 14, y)
    y += descLines.length * 4 + 2

    // Status per year
    filters.years.forEach(year => {
      const mapping = outcome.mappings[year]
      const status = mapping?.status || 'none'
      const course = mapping?.courseLink ? '✓ Cours' : '✗ Cours'
      const resources = (mapping?.resources?.length || 0) + ' ressources'

      doc.setFontSize(8)
      doc.text(`${year}: ${status} | ${course} | ${resources}`, 20, y)
      y += 4
    })

    // Tags
    if (outcome.tags?.length) {
      doc.text(`Tags: ${outcome.tags.join(', ')}`, 20, y)
      y += 4
    }

    y += 6 // Space between outcomes
  }

  doc.save(`DigComp_LO_${new Date().toISOString().split('T')[0]}.pdf`)
}
</script>
