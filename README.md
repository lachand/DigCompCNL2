# DigComp 3.0 - Dashboard & Pilotage

Application web moderne pour la gestion et le pilotage du référentiel de compétences numériques DigComp 3.0, avec collaboration temps réel et intelligence artificielle.

## 🚀 Fonctionnalités

- ✅ **Authentification Firebase** - Gestion sécurisée des utilisateurs
- ✅ **Chat temps réel** - Communication collaborative avec réactions et fichiers
- ✅ **Gestion des compétences** - CRUD complet des Learning Outcomes DigComp
- ✅ **Intelligence Artificielle** - Génération de contenu pédagogique (Gemini AI)
- ✅ **Dashboard** - Visualisations interactives (Chart.js, Plotly)
- ✅ **Kanban** - Gestion de workflow par drag & drop
- ✅ **Historique** - Snapshots et audit trail avec diff visuel
- ✅ **Visioconférence** - Intégration Jitsi Meet
- ✅ **Dark Mode** - Interface adaptative
- ✅ **Responsive** - Mobile et desktop

## 📦 Technologies

- **Vue 3** + Composition API + TypeScript
- **Vite** - Build tool rapide
- **Pinia** - State management
- **Firebase** - Auth + Firestore
- **VueFire** - Intégration Firebase réactive
- **Tailwind CSS** - Utility-first CSS
- **Chart.js** + **Plotly** - Visualisations
- **Google Gemini AI** - Génération de contenu
- **Jitsi Meet** - Visioconférence

## 🛠️ Développement Local

### Prérequis

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Firebase

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Variables d'environnement

Éditez le fichier `.env` avec vos credentials Firebase :

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_DATABASE_URL=https://votre_projet.firebaseio.com
```

## 🚀 Déploiement

### Option 1: Firebase Hosting (Recommandé)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser (une seule fois)
firebase init hosting

# Build et déployer
npm run build
firebase deploy --only hosting
```

### Option 2: GitHub Pages

Le déploiement est automatique via GitHub Actions à chaque push sur `main`.

### Option 3: Autres plateformes

- **Vercel**: Connecter le repo GitHub
- **Netlify**: Connecter le repo GitHub
- **Cloudflare Pages**: Connecter le repo GitHub

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec coverage
npm run test:coverage
```

## 📝 Scripts

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
npm run test         # Tests unitaires
```

## 📚 Documentation

- [Guide de déploiement Firebase](./DEPLOY_FIREBASE.md)
- [Configuration CI/CD](./CICD.md)

## 🤝 Contribution

1. Forker le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License

## 👥 Auteurs

Équipe DigComp - Université Lyon 2