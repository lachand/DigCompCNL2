# 🚀 Quick Start Guide - DigComp 3.0

Guide rapide pour démarrer avec l'application DigComp 3.0.

## ✅ Checklist Avant de Commencer

- [ ] Node.js >= 18 installé (`node --version`)
- [ ] npm >= 9 installé (`npm --version`)
- [ ] Git installé
- [ ] Compte Firebase créé
- [ ] Éditeur de code (VS Code recommandé)

## 📦 Installation (5 minutes)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/DigCompCNL2.git
cd DigCompCNL2
```

### 2. Installer les dépendances

```bash
npm install
```

**Si vous rencontrez des erreurs**, essayez :

```bash
# Option 1: Avec legacy peer deps
npm install --legacy-peer-deps

# Option 2: Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Option 3: Utiliser yarn
yarn install
```

### 3. Configurer Firebase

#### 3.1 Copier le fichier d'environnement

```bash
cp .env.example .env
```

#### 3.2 Obtenir vos clés Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Créer un nouveau projet (ou sélectionner un existant)
3. Aller dans ⚙️ Paramètres > Général
4. Descendre jusqu'à "Vos applications"
5. Cliquer sur l'icône Web `</>`
6. Copier les valeurs de configuration

#### 3.3 Éditer le fichier .env

```env
VITE_FIREBASE_API_KEY=AIzaSy...votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://votre-projet.firebaseio.com
```

### 4. Initialiser Firestore

#### 4.1 Activer Firestore

1. Dans Firebase Console, aller dans "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Choisir le mode **Production**
4. Sélectionner une région proche (ex: `europe-west1`)

#### 4.2 Activer Authentication

1. Aller dans "Authentication"
2. Cliquer sur "Commencer"
3. Activer "E-mail/Password"

#### 4.3 Créer un utilisateur de test

1. Dans Authentication > Users
2. Cliquer sur "Add user"
3. Email: `test@example.com`
4. Password: `password123`
5. Cliquer sur "Add user"

#### 4.4 Initialiser les données (Optionnel)

Créez manuellement dans Firestore :

**Collection**: `digcomp_data`
**Document ID**: `main_v2`
**Données**:

```json
{
  "domains": [],
  "tags": ["ASSP", "FJVD", "LANG", "LESLA", "SEG", "TT", "ICOM", "IETL", "IFS", "IPsyL", "ISPEF", "IUT", "CIEF"],
  "lastUpdated": 1234567890
}
```

Ou importez le fichier JSON :

```bash
# Depuis la racine du projet
# (Vous devrez créer un script d'import)
```

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

🎉 **C'est prêt !**

## 🔐 Se Connecter

1. Ouvrir http://localhost:5173
2. Entrer :
   - Email: `test@example.com`
   - Password: `password123`
3. Cliquer sur "Entrer"

## 🧪 Tester que Tout Fonctionne

### ✅ Dashboard

- Vous devriez voir le dashboard avec des KPIs
- Les graphiques devraient s'afficher (même vides)

### ✅ Chat

- Ouvrir le panneau de chat (icône en bas à droite)
- Envoyer un message
- Le message devrait apparaître

### ✅ Dark Mode

- Cliquer sur l'icône lune/soleil en haut
- Le thème devrait changer

## 📚 Prochaines Étapes

### Ajouter des compétences

1. Aller dans "L1", "L2" ou "L3"
2. Les compétences DigComp devraient s'afficher
3. Cliquer sur une compétence pour voir les détails

### Utiliser l'IA

1. Aller dans Settings (icône ⚙️)
2. Ajouter votre clé API Gemini : [Obtenir une clé](https://makersuite.google.com/app/apikey)
3. Tester la génération de contenu

### Déployer

Voir les guides :
- [Déploiement Firebase](./DEPLOY_FIREBASE.md)
- [CI/CD GitHub Actions](./CICD.md)

## ❓ Problèmes Courants

### L'app ne démarre pas

**Erreur**: `Cannot find module`

```bash
# Réinstaller
rm -rf node_modules
npm install
```

### Impossible de se connecter

**Solution**:
1. Vérifier que `.env` est bien configuré
2. Vérifier que Authentication est activé dans Firebase
3. Vérifier que l'utilisateur existe

### Firestore connection failed

**Solution**:
1. Vérifier les règles Firestore (voir `firestore.rules`)
2. Vérifier que Firestore est activé
3. Vérifier que `main_v2` existe

### Port 5173 déjà utilisé

```bash
# Utiliser un autre port
npm run dev -- --port 3000
```

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
npm run test         # Lancer les tests
npm run test:ui      # Tests avec interface UI
npm run test:coverage # Tests avec couverture
```

## 📖 Documentation Complète

- [README.md](./README.md) - Vue d'ensemble
- [DEPLOY_FIREBASE.md](./DEPLOY_FIREBASE.md) - Déploiement Firebase
- [CICD.md](./CICD.md) - Intégration Continue

## 💡 Astuces

### Hot Reload

Vite recharge automatiquement à chaque modification. Si ça ne fonctionne pas :

```bash
# Redémarrer le serveur
# Ctrl+C puis npm run dev
```

### DevTools Vue

Installez l'extension Vue DevTools pour Chrome/Firefox pour déboguer facilement.

### VS Code Extensions Recommandées

- **Volar** - Support Vue 3
- **TypeScript Vue Plugin (Volar)**
- **Tailwind CSS IntelliSense**
- **ESLint**
- **Prettier**

## 🆘 Support

- 📧 Email: support@digcomp.fr
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/DigCompCNL2/issues)
- 💬 Discord: [Rejoindre](https://discord.gg/digcomp)

---

**Bon développement ! 🚀**
