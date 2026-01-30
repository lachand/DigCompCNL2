import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Function to get Firebase config based on mode
const getFirebaseConfig = (mode: 'prod' | 'demo') => {
  const isProd = mode === 'prod'
  return {
    apiKey: isProd ? import.meta.env.VITE_FIREBASE_API_KEY_PROD : import.meta.env.VITE_FIREBASE_API_KEY_DEMO,
    authDomain: isProd ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_PROD : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_DEMO,
    databaseURL: isProd ? import.meta.env.VITE_FIREBASE_DATABASE_URL_PROD : import.meta.env.VITE_FIREBASE_DATABASE_URL_DEMO,
    projectId: isProd ? import.meta.env.VITE_FIREBASE_PROJECT_ID_PROD : import.meta.env.VITE_FIREBASE_PROJECT_ID_DEMO,
    storageBucket: isProd ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_PROD : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_DEMO,
    messagingSenderId: isProd ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_PROD : import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_DEMO,
    appId: isProd ? import.meta.env.VITE_FIREBASE_APP_ID_PROD : import.meta.env.VITE_FIREBASE_APP_ID_DEMO
  }
}

// Get mode from localStorage or default to 'prod'
const getMode = (): 'prod' | 'demo' => {
  try {
    const stored = localStorage.getItem('firebase_mode')
    return stored === 'demo' ? 'demo' : 'prod'
  } catch {
    return 'prod'
  }
}

const mode = getMode()
const firebaseConfig = getFirebaseConfig(mode)

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

// Export mode for UI
export const firebaseMode = mode
