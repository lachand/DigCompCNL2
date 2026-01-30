import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
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

async function initializeGamificationData() {
  try {
    console.log('🎮 Initialisation des données de gamification étendue...')

    // Créer des quêtes
    const quests = [
      {
        id: 'daily-login',
        title: 'Connexion quotidienne',
        description: 'Connectez-vous chaque jour cette semaine',
        type: 'weekly',
        category: 'learning',
        requirements: [
          { actionType: 'login', count: 7 }
        ],
        rewards: { points: 50 },
        isActive: true,
        startDate: Date.now(),
        endDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 jours
        maxCompletions: 1
      },
      {
        id: 'first-validation',
        title: 'Premier validateur',
        description: 'Validez votre premier objectif d\'apprentissage',
        type: 'special',
        category: 'learning',
        requirements: [
          { actionType: 'validation', count: 1 }
        ],
        rewards: { points: 25, badge: 'premier-pas' },
        isActive: true,
        startDate: Date.now(),
        endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 jours
        maxCompletions: 1
      },
      {
        id: 'comment-master',
        title: 'Maître des commentaires',
        description: 'Postez 5 commentaires constructifs',
        type: 'weekly',
        category: 'collaboration',
        requirements: [
          { actionType: 'comment', count: 5 }
        ],
        rewards: { points: 30 },
        isActive: true,
        startDate: Date.now(),
        endDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
        maxCompletions: 1
      },
      {
        id: 'resource-collector',
        title: 'Collectionneur de ressources',
        description: 'Ajoutez 3 nouvelles ressources pédagogiques',
        type: 'weekly',
        category: 'creation',
        requirements: [
          { actionType: 'resource', count: 3 }
        ],
        rewards: { points: 40 },
        isActive: true,
        startDate: Date.now(),
        endDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
        maxCompletions: 1
      }
    ]

    console.log('📝 Création des quêtes...')
    for (const quest of quests) {
      await setDoc(doc(db, 'quests', quest.id), quest)
      console.log(`✅ Quête "${quest.title}" créée`)
    }

    // Créer des défis
    const challenges = [
      {
        id: 'team-learning-challenge',
        title: 'Défi d\'équipe - Apprentissage collaboratif',
        description: 'Travaillez ensemble pour valider 10 objectifs d\'apprentissage en équipe',
        type: 'team',
        category: 'collaboration',
        requirements: [
          { actionType: 'validation', count: 10, timeframe: 168 } // 7 jours
        ],
        rewards: { points: 100 },
        participants: [],
        teams: [],
        startDate: Date.now(),
        endDate: Date.now() + (7 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: 'speed-reviewer',
        title: 'Relecteur rapide',
        description: 'Effectuez 5 reviews en moins de 24h',
        type: 'individual',
        category: 'review',
        requirements: [
          { actionType: 'review', count: 5, timeframe: 24 }
        ],
        rewards: { points: 75 },
        participants: [],
        startDate: Date.now(),
        endDate: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3 jours
        isActive: true
      }
    ]

    console.log('🏆 Création des défis...')
    for (const challenge of challenges) {
      await setDoc(doc(db, 'challenges', challenge.id), challenge)
      console.log(`✅ Défi "${challenge.title}" créé`)
    }

    // Créer des articles de boutique
    const shopItems = [
      {
        id: 'dark-theme',
        name: 'Thème Sombre Premium',
        description: 'Débloquez des variantes avancées du thème sombre',
        category: 'theme',
        price: 150,
        isLimited: false,
        isActive: true
      },
      {
        id: 'avatar-frame-gold',
        name: 'Cadre d\'avatar Or',
        description: 'Un cadre doré exclusif pour votre avatar',
        category: 'avatar',
        price: 200,
        isLimited: true,
        stock: 50,
        isActive: true
      },
      {
        id: 'notification-badge',
        name: 'Badge de notification spécial',
        description: 'Badge exclusif affiché dans vos notifications',
        category: 'badge',
        price: 100,
        isLimited: false,
        isActive: true
      },
      {
        id: 'streak-protector',
        name: 'Protecteur de série',
        description: 'Protège votre série active pendant 3 jours en cas d\'oubli',
        category: 'utility',
        price: 75,
        isLimited: false,
        isActive: true
      },
      {
        id: 'xp-booster',
        name: 'Multiplicateur d\'XP',
        description: 'Double les points gagnés pendant 24h',
        category: 'effect',
        price: 120,
        isLimited: true,
        stock: 100,
        isActive: true
      }
    ]

    console.log('🛒 Création des articles de boutique...')
    for (const item of shopItems) {
      await setDoc(doc(db, 'shopItems', item.id), item)
      console.log(`✅ Article "${item.name}" créé`)
    }

    console.log('🎉 Initialisation terminée !')
    console.log('')
    console.log('📋 Récapitulatif :')
    console.log(`   • ${quests.length} quêtes créées`)
    console.log(`   • ${challenges.length} défis créés`)
    console.log(`   • ${shopItems.length} articles en boutique`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error)
    process.exit(1)
  }
}

// Exécuter l'initialisation
initializeGamificationData()