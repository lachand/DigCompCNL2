<template>
  <Modal
    v-model="isOpen"
    title="Exporter vers Moodle (GIFT)"
    icon="ph-graduation-cap"
    size="lg"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Parsed Questions -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Questions détectées ({{ parsedQuestions.length }})
          </h3>
          <button
            @click="toggleAllQuestions"
            class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {{ allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>

        <div v-if="parsedQuestions.length === 0" class="p-6 text-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <i class="ph ph-warning text-4xl text-amber-500 mb-2"></i>
          <p class="text-gray-600 dark:text-gray-400">Aucune question détectée dans le contenu généré.</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Le format attendu est un QCM avec des choix a), b), c), d).</p>
        </div>

        <div v-else class="space-y-3 max-h-80 overflow-y-auto">
          <div
            v-for="(question, index) in parsedQuestions"
            :key="index"
            class="p-4 border rounded-lg transition"
            :class="selectedQuestions.includes(index)
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700'"
          >
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                :checked="selectedQuestions.includes(index)"
                @change="toggleQuestion(index)"
                class="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    Q{{ index + 1 }}
                  </span>
                  <span class="px-2 py-0.5 text-xs rounded" :class="getTypeClass(question.type)">
                    {{ getTypeLabel(question.type) }}
                  </span>
                </div>
                <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">{{ question.text }}</p>
                <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div v-for="(choice, cIndex) in question.choices" :key="cIndex" class="flex items-center gap-2">
                    <span :class="choice.isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : ''">
                      {{ String.fromCharCode(97 + cIndex) }}) {{ choice.text }}
                      <i v-if="choice.isCorrect" class="ph ph-check ml-1"></i>
                    </span>
                  </div>
                </div>
              </div>
            </label>

            <!-- Question Type Selector -->
            <div class="mt-3 flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">Type:</label>
              <select
                v-model="question.type"
                class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="mcq">QCM (choix unique)</option>
                <option value="mcq-multi">QCM (choix multiples)</option>
                <option value="truefalse">Vrai/Faux</option>
                <option value="shortanswer">Réponse courte</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- GIFT Preview -->
      <div v-if="selectedQuestions.length > 0">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Aperçu GIFT
        </h3>
        <div class="p-4 bg-gray-900 rounded-lg overflow-x-auto">
          <pre class="text-sm text-green-400 whitespace-pre-wrap font-mono">{{ giftOutput }}</pre>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          @click="copyGift"
          :disabled="selectedQuestions.length === 0"
          class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center justify-center gap-2"
        >
          <i class="ph ph-copy"></i>
          <span>Copier</span>
        </button>
        <button
          @click="downloadGift"
          :disabled="selectedQuestions.length === 0"
          class="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition flex items-center justify-center gap-2"
        >
          <i class="ph ph-download-simple"></i>
          <span>Télécharger .gift</span>
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { copyToClipboard, downloadFile } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'

interface QuestionChoice {
  text: string
  isCorrect: boolean
}

interface ParsedQuestion {
  text: string
  choices: QuestionChoice[]
  type: 'mcq' | 'mcq-multi' | 'truefalse' | 'shortanswer'
  explanation?: string
}

interface Props {
  modelValue: boolean
  content: string
  outcomeId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { success } = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const parsedQuestions = ref<ParsedQuestion[]>([])
const selectedQuestions = ref<number[]>([])

const allSelected = computed(() =>
  parsedQuestions.value.length > 0 &&
  selectedQuestions.value.length === parsedQuestions.value.length
)

// Parse questions when content changes
watch(() => props.content, parseQCMContent, { immediate: true })

function parseQCMContent() {
  const content = props.content
  parsedQuestions.value = []
  selectedQuestions.value = []

  if (!content) return

  // Split content by "### Question X" headers
  const questionBlocks = content.split(/###\s*Question\s*\d+\s*/i).filter(block => block.trim())

  questionBlocks.forEach((block) => {
    const question = parseQuestionBlock(block)
    if (question) {
      parsedQuestions.value.push(question)
      selectedQuestions.value.push(parsedQuestions.value.length - 1)
    }
  })
}

function parseQuestionBlock(block: string): ParsedQuestion | null {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length === 0) return null

  // Find question text (lines before the first choice a))
  const questionLines: string[] = []
  let choiceStartIndex = 0

  for (let i = 0; i < lines.length; i++) {
    if (/^[a-d]\)\s*/i.test(lines[i])) {
      choiceStartIndex = i
      break
    }
    // Skip "Réponse correcte" and "Explication" lines
    if (!/\*\*(Réponse|Explication)/i.test(lines[i])) {
      questionLines.push(lines[i])
    }
  }

  const questionText = questionLines.join(' ').trim()
  if (!questionText) return null

  // Parse choices (a), b), c), d))
  const choices: QuestionChoice[] = []
  const choicePattern = /^([a-d])\)\s*(.+)/i

  for (let i = choiceStartIndex; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(choicePattern)
    if (match) {
      choices.push({
        text: match[2].replace(/\*\*/g, '').trim(),
        isCorrect: false
      })
    }
  }

  // Find correct answer - try multiple patterns
  const patterns = [
    /\*\*Réponse\s*correcte\s*:\*\*\s*([a-d])/i,
    /Réponse\s*correcte\s*:\s*\*\*([a-d])\*\*/i,
    /Réponse\s*correcte\s*:\s*([a-d])/i,
    /\*\*Réponse\s*:\*\*\s*([a-d])/i,
    /Bonne\s*réponse\s*:\s*([a-d])/i
  ]

  for (const pattern of patterns) {
    const match = block.match(pattern)
    if (match && choices.length > 0) {
      const correctIndex = match[1].toLowerCase().charCodeAt(0) - 97
      if (correctIndex >= 0 && correctIndex < choices.length) {
        choices[correctIndex].isCorrect = true
        break
      }
    }
  }

  // If no correct answer found via pattern, check if any choice has markers
  if (!choices.some(c => c.isCorrect)) {
    choices.forEach(c => {
      if (c.text.includes('✓') || c.text.includes('(correct)')) {
        c.isCorrect = true
        c.text = c.text.replace(/✓|\(correct\)/gi, '').trim()
      }
    })
  }

  // Parse explanation if exists
  const explanationPattern = /\*\*Explication\s*:\*\*\s*(.+)/i
  const explanationMatch = block.match(explanationPattern)
  const explanation = explanationMatch ? explanationMatch[1].trim() : undefined

  if (choices.length < 2) return null

  return {
    text: questionText,
    choices,
    type: 'mcq',
    explanation
  }
}

function toggleQuestion(index: number) {
  const idx = selectedQuestions.value.indexOf(index)
  if (idx === -1) {
    selectedQuestions.value.push(index)
  } else {
    selectedQuestions.value.splice(idx, 1)
  }
}

function toggleAllQuestions() {
  if (allSelected.value) {
    selectedQuestions.value = []
  } else {
    selectedQuestions.value = parsedQuestions.value.map((_, i) => i)
  }
}

function getTypeClass(type: string) {
  const classes: Record<string, string> = {
    'mcq': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'mcq-multi': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    'truefalse': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'shortanswer': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  }
  return classes[type] || classes['mcq']
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    'mcq': 'QCM',
    'mcq-multi': 'Choix multiples',
    'truefalse': 'Vrai/Faux',
    'shortanswer': 'Réponse courte'
  }
  return labels[type] || 'QCM'
}

// Convert to GIFT format
const giftOutput = computed(() => {
  const lines: string[] = []
  lines.push(`// Questions générées pour ${props.outcomeId}`)
  lines.push(`// Exporté depuis DigComp 3.0 - ${new Date().toLocaleDateString('fr-FR')}`)
  lines.push('')

  selectedQuestions.value.forEach(index => {
    const q = parsedQuestions.value[index]
    if (!q) return

    lines.push(`// Question ${index + 1}`)

    switch (q.type) {
      case 'mcq':
        lines.push(convertToGiftMCQ(q, index))
        break
      case 'mcq-multi':
        lines.push(convertToGiftMCQMulti(q, index))
        break
      case 'truefalse':
        lines.push(convertToGiftTrueFalse(q, index))
        break
      case 'shortanswer':
        lines.push(convertToGiftShortAnswer(q, index))
        break
    }
    lines.push('')
  })

  return lines.join('\n')
})

function escapeGift(text: string): string {
  // Escape special GIFT characters
  return text
    .replace(/~/g, '\\~')
    .replace(/=/g, '\\=')
    .replace(/#/g, '\\#')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/:/g, '\\:')
}

function convertToGiftMCQ(q: ParsedQuestion, index: number): string {
  const title = `Q${index + 1}_${props.outcomeId}`
  const choices = q.choices.map(c => {
    const prefix = c.isCorrect ? '=' : '~'
    return `  ${prefix}${escapeGift(c.text)}`
  }).join('\n')

  return `::${title}::${escapeGift(q.text)}{\n${choices}\n}`
}

function convertToGiftMCQMulti(q: ParsedQuestion, index: number): string {
  const title = `Q${index + 1}_${props.outcomeId}`
  const correctCount = q.choices.filter(c => c.isCorrect).length
  const incorrectCount = q.choices.length - correctCount

  const correctWeight = correctCount > 0 ? Math.round(100 / correctCount) : 0
  const incorrectWeight = incorrectCount > 0 ? Math.round(-100 / incorrectCount) : 0

  const choices = q.choices.map(c => {
    const weight = c.isCorrect ? correctWeight : incorrectWeight
    return `  ~%${weight}%${escapeGift(c.text)}`
  }).join('\n')

  return `::${title}::${escapeGift(q.text)}{\n${choices}\n}`
}

function convertToGiftTrueFalse(q: ParsedQuestion, index: number): string {
  const title = `Q${index + 1}_${props.outcomeId}`
  const isTrue = q.choices.some(c => c.isCorrect && c.text.toLowerCase().includes('vrai'))
  return `::${title}::${escapeGift(q.text)}{${isTrue ? 'TRUE' : 'FALSE'}}`
}

function convertToGiftShortAnswer(q: ParsedQuestion, index: number): string {
  const title = `Q${index + 1}_${props.outcomeId}`
  const correctAnswers = q.choices.filter(c => c.isCorrect).map(c => `=${escapeGift(c.text)}`).join('\n  ')
  return `::${title}::${escapeGift(q.text)}{\n  ${correctAnswers}\n}`
}

async function copyGift() {
  await copyToClipboard(giftOutput.value)
  success('Format GIFT copié dans le presse-papier')
}

function downloadGift() {
  const filename = `${props.outcomeId}_qcm.gift`
  downloadFile(giftOutput.value, filename, 'text/plain')
  success('Fichier GIFT téléchargé')
}
</script>
