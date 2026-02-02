import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Function to get Firebase config based on mode
const getFirebaseConfig = (mode: 'prod' | 'demo') => {
  const isProd = mode === 'prod'
  
  // Vérifier si les variables d'environnement existent
  const apiKey = isProd ? import.meta.env.VITE_FIREBASE_API_KEY_PROD : import.meta.env.VITE_FIREBASE_API_KEY_DEMO
  const projectId = isProd ? import.meta.env.VITE_FIREBASE_PROJECT_ID_PROD : import.meta.env.VITE_FIREBASE_PROJECT_ID_DEMO
  
  if (!apiKey || !projectId) {
    console.warn(`⚠️  Configuration Firebase manquante pour le mode ${mode}`)
    console.warn('Veuillez configurer vos variables d\'environnement Firebase dans .env.local')
    return null
  }
  
  return {
    apiKey,
    authDomain: isProd ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_PROD : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_DEMO,
    databaseURL: isProd ? import.meta.env.VITE_FIREBASE_DATABASE_URL_PROD : import.meta.env.VITE_FIREBASE_DATABASE_URL_DEMO,
    projectId,
    storageBucket: isProd ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_PROD : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_DEMO,
    messagingSenderId: isProd ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_PROD : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_DEMO,
    appId: isProd ? import.meta.env.VITE_FIREBASE_APP_ID_PROD : import.meta.env.VITE_FIREBASE_APP_ID_DEMO
  }
}

// Get mode from localStorage or default to 'prod' (client-side safe)
const getMode = (): 'prod' | 'demo' => {
  if (typeof window === 'undefined') return 'prod'
  try {
    const stored = localStorage.getItem('firebase_mode')
    return stored === 'demo' ? 'demo' : 'prod'
  } catch {
    return 'prod'
  }
}

// Initialize Firebase app with prod config by default
const firebaseConfig = getFirebaseConfig('prod')

let _firebaseApp: ReturnType<typeof initializeApp> | null = null
let _auth: ReturnType<typeof getAuth> | null = null
let _db: ReturnType<typeof getFirestore> | null = null

if (firebaseConfig) {
  try {
    _firebaseApp = initializeApp(firebaseConfig)
    _auth = getAuth(_firebaseApp)
    _db = getFirestore(_firebaseApp)
    console.log('✅ Firebase initialisé avec succès')
  } catch (error) {
    console.error('❌ Erreur d\'initialisation Firebase:', error)
  }
} else {
  console.warn('⚠️  Firebase non initialisé - configuration manquante')
}

// Export Firebase instances (peuvent être null si pas de config)
export const firebaseApp = _firebaseApp
export const app = _firebaseApp
export const auth = _auth
export const db = _db

// VAPID key pour les notifications push
export const vapidKey = 'BKQHESYM4wnZwWamBw1prtPHJPuRd1TpKfnv1UW53zrveVXLvDz8kPr56MeUvGuDW6ERfMQOhDXoVSrUvgYjmHU'

// Function to get current mode (called after DOM loaded)
export const getFirebaseMode = () => getMode()
