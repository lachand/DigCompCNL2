# Guide d'installation DigComp 3.0

## Prérequis

- Node.js 18+ et npm
- Un projet Firebase avec Firestore et Authentication
- Une clé API Google Gemini (optionnel pour les fonctionnalités IA)

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Firebase

Créez un fichier `.env` à la racine avec vos identifiants Firebase:

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Ou modifiez directement `/src/firebase/config.ts`

### 3. Activer Firebase Authentication

Dans la console Firebase:
1. Aller dans Authentication
2. Activer "Email/Password"
3. Créer votre premier utilisateur

### 4. Importer les données DigComp dans Firestore

```bash
# Utilisez le script d'import ou importez manuellement via la console
# Collection: digcomp_data
# Document: main_v2
# Contenu: le JSON du fichier digcomp_v3_LO_fr_complet.json
```

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:5173

## Configuration optionnelle

### Clé API Gemini

Pour les fonctionnalités IA:
1. Obtenez une clé sur https://makersuite.google.com/app/apikey
2. Dans l'app, cliquez sur Settings (roue dentée)
3. Entrez votre clé API Gemini
4. Choisissez le modèle (gemini-1.5-flash recommandé)

### Son de notification

Dans les settings, choisissez parmi 14 sons:
- Beep, Fanfare, Chat, SNCF, Windows XP, etc.

## Build production

```bash
npm run build
npm run preview
```

## Déploiement

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Autre plateforme

Le dossier `dist/` contient les fichiers statiques.

## Dépannage

### Erreur de connexion Firebase
- Vérifiez vos identifiants Firebase
- Vérifiez que Firestore et Auth sont activés

### Composants ne s'affichent pas
- Vérifiez que tous les imports sont corrects
- npm run dev redémarre le serveur

### Dark mode ne fonctionne pas
- Le composable useDarkMode doit être importé
- Vérifiez que Tailwind est configuré avec darkMode: 'class'

## Support

Consultez le fichier COMPONENTS_CREATED.md pour la liste complète des fonctionnalités.
