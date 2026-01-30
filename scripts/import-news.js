import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
config({ path: join(__dirname, '..', '.env') })

// Récupérer le mode depuis les arguments de ligne de commande (par défaut 'prod')
const mode = process.argv[2] === 'demo' ? 'demo' : 'prod'
const forceUpdate = process.argv.includes('--force')
console.log(`🔧 Mode sélectionné : ${mode}`)

// Configuration Firebase
const firebaseConfig = {
  apiKey: mode === 'prod' ? process.env.VITE_FIREBASE_API_KEY_PROD : process.env.VITE_FIREBASE_API_KEY_DEMO,
  authDomain: mode === 'prod' ? process.env.VITE_FIREBASE_AUTH_DOMAIN_PROD : process.env.VITE_FIREBASE_AUTH_DOMAIN_DEMO,
  databaseURL: mode === 'prod' ? process.env.VITE_FIREBASE_DATABASE_URL_PROD : process.env.VITE_FIREBASE_DATABASE_URL_DEMO,
  projectId: mode === 'prod' ? process.env.VITE_FIREBASE_PROJECT_ID_PROD : process.env.VITE_FIREBASE_PROJECT_ID_DEMO,
  storageBucket: mode === 'prod' ? process.env.VITE_FIREBASE_STORAGE_BUCKET_PROD : process.env.VITE_FIREBASE_STORAGE_BUCKET_DEMO,
  messagingSenderId: mode === 'prod' ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID_PROD : process.env.VITE_FIREBASE_MESSAGING_SENDER_ID_DEMO,
  appId: mode === 'prod' ? process.env.VITE_FIREBASE_APP_ID_PROD : process.env.VITE_FIREBASE_APP_ID_DEMO
}

console.log(`🔗 Connexion à Firebase project: ${firebaseConfig.projectId}`)

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function importNews() {
  try {
    console.log('🔄 Lecture du fichier news.json...')

    // Lire le fichier news.json
    const newsData = JSON.parse(readFileSync(join(__dirname, '..', 'news.json'), 'utf8'))

    console.log(`📄 ${newsData.length} nouveauté(s) trouvée(s) dans le fichier`)

    for (const newsItem of newsData) {
      const { id, ...newsDataWithoutId } = newsItem

      // Vérifier si la nouveauté existe déjà
      const newsRef = doc(db, 'news', id)
      const existingDoc = await getDoc(newsRef)

      if (existingDoc.exists()) {
        if (forceUpdate) {
          // Mettre à jour la nouveauté existante
          await setDoc(newsRef, newsDataWithoutId)
          console.log(`🔄 Nouveauté "${newsItem.title}" mise à jour`)
        } else {
          console.log(`⏭️  Nouveauté "${newsItem.title}" existe déjà, ignorée`)
        }
      } else {
        // Créer la nouveauté
        await setDoc(newsRef, newsDataWithoutId)
        console.log(`✅ Nouveauté "${newsItem.title}" créée avec succès`)
      }
    }

    console.log('🎉 Import terminé !')
  } catch (error) {
    console.error('❌ Erreur lors de l\'import :', error)
    process.exit(1)
  }
}

// Exécuter l'import
importNews()