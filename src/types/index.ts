import type { Timestamp } from 'firebase/firestore'

export type YearLevel = 'L1' | 'L2' | 'L3'
export type StatusType = 'none' | 'draft' | 'review' | 'validated' | 'obsolete'
export type LevelType = 'Basic' | 'Intermediate' | 'Advanced' | 'Highly advanced'
export type ResourceType = 'video' | 'document' | 'file'
export type AIGenerationType = 'course' | 'td' | 'qcm' | 'practice'
export type UserStatus = 'online' | 'idle'

export const OFFICIAL_TITLES: Record<string, string> = {
  '1.1': 'Naviguer, rechercher et filtrer',
  '1.2': 'Évaluer les données',
  '1.3': 'Gérer les données',
  '2.1': 'Interagir via le numérique',
  '2.2': 'Partager',
  '2.3': 'Citoyenneté',
  '2.4': 'Collaborer',
  '2.5': 'Nétiquette',
  '2.6': 'Identité numérique',
  '3.1': 'Développer contenu',
  '3.2': 'Intégrer',
  '3.3': 'Droits d\'auteur',
  '3.4': 'Programmation',
  '4.1': 'Protéger équipements',
  '4.2': 'Protéger données',
  '4.3': 'Protéger santé',
  '4.4': 'Protéger environnement',
  '5.1': 'Résoudre problèmes',
  '5.2': 'Identifier besoins',
  '5.3': 'Créativité',
  '5.4': 'Lacunes'
}

export interface Resource {
  title: string
  url: string
  type?: ResourceType
  aiAnalysis?: {
    duration?: string
    tags?: string[]
    summary?: string
  }
}

export interface Deadline {
  date: number      // timestamp
  label: string     // ex: "Finalisation L1"
}

export interface YearMapping {
  status: StatusType
  courseLink?: string
  resources?: Resource[]
  deadline?: Deadline
}

export interface Comment {
  text: string
  author: string
  date: number
  year?: YearLevel
}

export interface LearningOutcome {
  id: string
  description: string
  level: LevelType
  tags?: string[]
  assignees?: string[]
  mappings: {
    L1: YearMapping
    L2: YearMapping
    L3: YearMapping
  }
  comments?: Comment[]
}

export interface Competence {
  id: string
  name: string
  outcomes: LearningOutcome[]
}

export interface Domain {
  id: string
  name: string
  competences: Competence[]
}

export interface DigCompData {
  domains: Domain[]
  tags?: string[]
  lastUpdated?: number
}

export interface User {
  uid: string
  email: string
  lastSeen?: number
  state?: UserStatus
  isTyping?: boolean
  lastChatOpen?: number
  prefSound?: string
  apiKey?: string
  aiModel?: string
  pinned?: string[]
}

export interface ChatMessage {
  id?: string
  text: string
  sender: string
  timestamp: number
  attachment?: string
  attachmentName?: string
  attachmentType?: string
  reactions?: Record<string, string[]>
}

export interface AuditLog {
  id?: string
  timestamp: number
  user: string
  action: string
  targetId: string
  desc: string
  year?: YearLevel
  oldVal?: string
  newVal?: string
}

export interface ActivityFeed {
  id?: string
  user: string
  action: string
  detail: string
  date: number
}

export interface Notification {
  id?: string
  userId: string
  title: string
  message: string
  targetId?: string
  timestamp: number
  read?: boolean
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ReviewRequest {
  id?: string
  outcomeId: string
  year: YearLevel
  requestedBy: string
  reviewer: string
  status: ReviewStatus
  comment?: string
  requestComment?: string
  createdAt: number
  resolvedAt?: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: number
}

export interface UserStats {
  id?: string
  userId: string
  points: number
  badges: string[]
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
  actionCounts: {
    statusChanges: number
    reviews: number
    validations: number
    comments: number
    resources: number
  }
}

export interface ExternalMember {
  id: string
  firstName: string
  lastName: string
  createdBy: string
  createdAt: number
}

export interface Lock {
  user: string
  timestamp: number
}

export interface Snapshot {
  id?: string
  name: string
  user: string
  date: number
  data: Domain[]
}

export interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

export interface HunterSearchTerms {
  youtube: string[]
  google: string[]
  wikipedia: string[]
}

export interface HunterResult {
  videos?: Array<{ title: string; url: string }>
  docs?: Array<{ title: string; url: string }>
  images?: Array<{ title: string; url: string }>
}

export const TAG_NAMES: Record<string, string> = {
  ASSP: 'Anthropologie, sociologie et science politique',
  FJVD: 'Faculté de Droit Julie-Victoire Daubié',
  LANG: 'Langues',
  LESLA: 'Lettres, sciences du langage et arts',
  SEG: 'Sciences économiques et gestion',
  TT: 'Temps et territoires',
  ICOM: 'Institut de la communication',
  IETL: 'Institut d\'études du travail de Lyon',
  IFS: 'Institut de formation syndicale',
  IPsyL: 'Institut de Psychologie de Lyon',
  ISPEF: 'Institut des sciences et pratiques de l\'éducation et de formation',
  IUT: 'IUT',
  CIEF: 'Centre international d\'études françaises'
}

export const SOUND_OPTIONS = [
  { value: 'fanfare', label: 'Fanfare' },
  { value: 'meow', label: 'Chat' },
  { value: 'college', label: 'Collège' },
  { value: 'sncf', label: 'SNCF' },
  { value: 'xp', label: 'Erreur XP' },
  { value: 'motus', label: 'Motus' },
  { value: 'airhorn', label: 'Airhorn' },
  { value: 'heehee', label: 'Hee-hee' },
  { value: 'romantic', label: 'Romantique' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'tennis2', label: 'Tennis 2' },
  { value: 'gandalf', label: 'Gandalf' },
  { value: 'kawoosh', label: 'Kawoosh' },
  { value: 'zat', label: 'Zat' },
  { value: 'beep', label: 'Beep' }
]

export const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7'
]

// AI Models available
export const AI_MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Rapide et économique' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Plus puissant et précis' }
]

// AI Generation history entry
export interface AIHistoryEntry {
  id: string
  outcomeId: string
  outcomeDescription: string
  type: AIGenerationType
  model: string
  content: string
  timestamp: number
  user: string
}

// Magic Import result
export interface MagicImportMatch {
  outcomeId: string
  confidence: number
  reasoning: string
}

export interface MagicImportResult {
  url: string
  title: string
  summary: string
  matches: MagicImportMatch[]
  suggestedType: ResourceType
}

// Export filter options
export interface ExportFilters {
  years: YearLevel[]
  statuses: StatusType[]
  domains: string[]
  tags: string[]
  onlyWithCourse: boolean
  onlyWithResources: boolean
}

// Favorite resource
export interface FavoriteResource {
  outcomeId: string
  year: YearLevel
  resourceIndex: number
  addedAt: number
}
