import { USER_COLORS } from '@/types'

export function hashEmail(email: string): number {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getUserColor(email: string): string {
  const hash = hashEmail(email)
  return USER_COLORS[hash % USER_COLORS.length]
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString('fr-FR')
  } else if (days > 0) {
    return `il y a ${days}j`
  } else if (hours > 0) {
    return `il y a ${hours}h`
  } else if (minutes > 0) {
    return `il y a ${minutes}min`
  } else {
    return 'À l\'instant'
  }
}

export function playSound(soundName: string): void {
  if (soundName === 'beep') {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    return
  }

  const soundUrls: Record<string, string> = {
    fanfare: 'https://www.myinstants.com/media/sounds/fanfare.mp3',
    meow: 'https://www.myinstants.com/media/sounds/m-e-o-w.mp3',
    college: 'https://www.myinstants.com/media/sounds/college-bip.mp3',
    sncf: 'https://www.myinstants.com/media/sounds/sncf.mp3',
    xp: 'https://www.myinstants.com/media/sounds/windows-xp-error.mp3',
    motus: 'https://www.myinstants.com/media/sounds/motus.mp3',
    airhorn: 'https://www.myinstants.com/media/sounds/air-horn.mp3',
    heehee: 'https://www.myinstants.com/media/sounds/hee-hee.mp3',
    romantic: 'https://www.myinstants.com/media/sounds/romantic-music.mp3',
    tennis: 'https://www.myinstants.com/media/sounds/tennis-shot.mp3',
    tennis2 : 'https://www.myinstants.com/media/sounds/tennis-shot-2.mp3',
    gandalf: 'https://www.myinstants.com/media/sounds/you-shall-not-pass.mp3',
    kawoosh: 'https://www.myinstants.com/media/sounds/spellgate-activation.mp3',
    zat: 'https://www.myinstants.com/media/sounds/zat-gun-2.mp3'
  }

  const url = soundUrls[soundName]
  if (url) {
    const audio = new Audio(url)
    audio.volume = 0.5
    audio.play().catch(() => {})
  }
}

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function showDesktopNotification(title: string, body: string, onClick?: () => void): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, { body })
    if (onClick) {
      notification.onclick = onClick
    }
  }
}

export function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-500 underline">$1</a>')
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
// Level translation
export function translateLevel(level: string): string {
  const translations: Record<string, string> = {
    'Basic': 'Basique',
    'Intermediate': 'Intermédiaire',
    'Advanced': 'Avancé',
    'Highly advanced': 'Expert'
  }
  return translations[level] || level
}