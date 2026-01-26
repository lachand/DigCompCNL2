# 🚀 Vos Prochaines Étapes

## ✅ Configuration Terminée

Votre fichier `.env` est déjà configuré avec vos informations Firebase :

```
✅ API Key: AIzaSyA1u9I4OQsKlfwi9X-cFMQmCxelWyJcdw8
✅ Auth Domain: toccata-958f9.firebaseapp.com
✅ Project ID: toccata-958f9
✅ Storage Bucket: toccata-958f9.firebasestorage.app
✅ App ID: 1:867467991937:web:a084bd4f07bdf49f386680
```

## 📦 Installation en Cours

L'installation des dépendances npm est en cours d'exécution en arrière-plan...

Si l'installation échoue encore, voici vos options :

### Option 1: Installer Yarn (Recommandé)

```bash
# Installer Yarn globalement
npm install -g yarn

# Installer les dépendances avec Yarn
yarn install
```

### Option 2: npm avec configuration réseau

```bash
# Augmenter les timeouts
npm config set fetch-timeout 600000
npm config set fetch-retries 10

# Réessayer l'installation
npm install --legacy-peer-deps
```

### Option 3: Installation manuelle par morceaux

```bash
# Nettoyer
rm -rf node_modules package-lock.json

# Installer les dépendances principales d'abord
npm install vue@3.5.13 vue-router@4.4.5 pinia@2.2.6

# Puis Firebase
npm install firebase@10.14.0 vuefire@3.2.0

# Puis le reste
npm install
```

## 🧪 Une Fois les Dépendances Installées

### 1. Vérifier que tout fonctionne

```bash
# Lister les dépendances installées
npm list --depth=0

# Vérifier qu'il n'y a pas d'erreurs TypeScript
npx vue-tsc --noEmit
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

### 3. Tester les fonctionnalités de base

- [ ] Page de login s'affiche
- [ ] Connexion fonctionne (utilisez un compte Firebase existant)
- [ ] Dashboard s'affiche
- [ ] Dark mode fonctionne (icône lune/soleil)
- [ ] Chat s'ouvre (panneau latéral)
- [ ] Navigation Sidebar fonctionne

## 🔥 Configurer Firebase (Si pas déjà fait)

### 1. Activer Authentication

1. Aller sur https://console.firebase.google.com/project/toccata-958f9
2. Authentication > Sign-in method
3. Activer "Email/Password"
4. Créer un utilisateur de test

### 2. Activer Firestore

1. Firestore Database > Create database
2. Mode: Production
3. Région: europe-west1 (ou proche de vous)

### 3. Déployer les règles Firestore

```bash
# Installer Firebase CLI si nécessaire
npm install -g firebase-tools

# Se connecter
firebase login

# Déployer les règles
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Initialiser les données

Dans Firestore, créez manuellement :

**Collection**: `digcomp_data`
**Document ID**: `main_v2`
**Données**:

```json
{
  "domains": [],
  "tags": [
    "ASSP", "FJVD", "LANG", "LESLA", "SEG", "TT",
    "ICOM", "IETL", "IFS", "IPsyL", "ISPEF", "IUT", "CIEF"
  ],
  "lastUpdated": 1737829200000
}
```

Ou importez votre fichier `digcomp_v3_LO_fr_complet.json` existant.

## 🚀 Build de Production

```bash
# Build
npm run build

# Prévisualiser le build
npm run preview
```

## 🌐 Déployer sur Firebase Hosting

```bash
# Première fois : initialiser
firebase init hosting

# Déployer
firebase deploy --only hosting
```

Votre app sera sur : **https://toccata-958f9.web.app**

## 🧪 Tests

```bash
# Tests en mode watch
npm run test

# Tests avec UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 🤖 Activer CI/CD GitHub

### 1. Configurer les Secrets GitHub

Aller dans votre repo GitHub > Settings > Secrets and variables > Actions

Ajoutez ces secrets :

```
VITE_FIREBASE_API_KEY=AIzaSyA1u9I4OQsKlfwi9X-cFMQmCxelWyJcdw8
VITE_FIREBASE_AUTH_DOMAIN=toccata-958f9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=toccata-958f9
VITE_FIREBASE_STORAGE_BUCKET=toccata-958f9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=867467991937
VITE_FIREBASE_APP_ID=1:867467991937:web:a084bd4f07bdf49f386680
VITE_FIREBASE_DATABASE_URL=https://toccata-958f9.firebaseio.com
```

### 2. Créer le Service Account Firebase

```bash
firebase init hosting:github
```

Cela créera automatiquement le secret `FIREBASE_SERVICE_ACCOUNT`.

### 3. Push et déploiement automatique

```bash
git add .
git commit -m "feat: migration to Vue 3 complete"
git push origin main
```

GitHub Actions va automatiquement :
- Lancer les tests
- Builder l'app
- Déployer sur Firebase Hosting

## 📚 Documentation

- **Démarrage rapide** : [QUICKSTART.md](./QUICKSTART.md)
- **Déploiement Firebase** : [DEPLOY_FIREBASE.md](./DEPLOY_FIREBASE.md)
- **CI/CD** : [CICD.md](./CICD.md)
- **Migration complète** : [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)

## 🐛 Dépannage

### L'app ne démarre pas

```bash
# Vérifier les erreurs
npm run dev 2>&1 | tee dev.log

# Vérifier TypeScript
npx vue-tsc --noEmit
```

### Erreur "Cannot find module"

```bash
# Réinstaller tout
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Firebase connection error

1. Vérifiez que `.env` existe et est bien configuré
2. Redémarrez le serveur de dev
3. Vérifiez que Firestore et Auth sont activés dans Firebase Console

## ✅ Checklist Finale

- [ ] `npm install` réussi
- [ ] `npm run dev` démarre sans erreur
- [ ] Application accessible sur http://localhost:5173
- [ ] Connexion Firebase fonctionne
- [ ] Firestore est activé
- [ ] Document `digcomp_data/main_v2` existe
- [ ] Tests passent (`npm run test`)
- [ ] Build de production fonctionne (`npm run build`)
- [ ] Déploiement Firebase configuré
- [ ] GitHub Actions configuré (optionnel)

## 🎉 C'est Parti !

Une fois l'installation terminée, lancez simplement :

```bash
npm run dev
```

Et ouvrez http://localhost:5173

**Bon développement ! 🚀**
