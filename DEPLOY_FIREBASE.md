# Guide de Déploiement Firebase

Ce guide vous explique comment déployer l'application DigComp 3.0 sur Firebase Hosting.

## Prérequis

- Un compte Google/Firebase
- Node.js >= 18
- npm >= 9

## 1. Configuration Firebase

### 1.1 Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur "Ajouter un projet"
3. Nommer votre projet (ex: `digcomp-lyon2`)
4. Activer Google Analytics (optionnel)
5. Créer le projet

### 1.2 Activer Firestore

1. Dans le menu latéral, aller dans "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Choisir le mode **Production**
4. Sélectionner une région (ex: `europe-west1`)
5. Créer

###1.3 Activer Authentication

1. Dans le menu latéral, aller dans "Authentication"
2. Cliquer sur "Commencer"
3. Activer "Adresse e-mail/Mot de passe"
4. Enregistrer

### 1.4 Configurer les règles de sécurité

**Firestore Rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règle générale : authentifié
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules** (si vous utilisez Storage):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 1.5 Récupérer les clés Firebase

1. Dans les paramètres du projet (⚙️ > Paramètres du projet)
2. Aller dans "Vos applications"
3. Cliquer sur l'icône Web `</>`
4. Enregistrer l'application (ex: `DigComp Web`)
5. Copier les clés de configuration

## 2. Configuration Locale

### 2.1 Variables d'environnement

Créez le fichier `.env` à la racine du projet :

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### 2.2 Initialiser les données Firestore

Créez un document initial dans Firestore :

**Collection**: `digcomp_data`
**Document ID**: `main_v2`
**Champs**:

```json
{
  "domains": [],
  "tags": [
    "ASSP", "FJVD", "LANG", "LESLA", "SEG", "TT",
    "ICOM", "IETL", "IFS", "IPsyL", "ISPEF", "IUT", "CIEF"
  ],
  "lastUpdated": 1234567890
}
```

Ou importez le fichier `digcomp_v3_LO_fr_complet.json` via un script d'import.

## 3. Installation Firebase CLI

```bash
# Installation globale
npm install -g firebase-tools

# Vérification
firebase --version
```

## 4. Connexion Firebase

```bash
# Se connecter avec votre compte Google
firebase login

# Vérifier la connexion
firebase projects:list
```

## 5. Initialisation Firebase Hosting

```bash
# Initialiser Firebase dans le projet
firebase init hosting
```

Répondez aux questions :

1. **Existing project** : Sélectionnez votre projet
2. **Public directory** : `dist`
3. **Single-page app** : `Yes`
4. **Automatic builds with GitHub** : `Yes` (si vous voulez)
5. **Overwrite index.html** : `No`

Cela créera les fichiers :
- `firebase.json`
- `.firebaserc`
- `.github/workflows/firebase-hosting-*.yml` (si GitHub Actions activé)

## 6. Build de Production

```bash
# Build optimisé
npm run build

# Vérifier le dossier dist/
ls -la dist/
```

## 7. Déploiement

### 7.1 Déploiement Manuel

```bash
# Déployer sur Firebase Hosting
firebase deploy --only hosting

# Ou déployer tout (hosting + firestore + storage)
firebase deploy
```

Sortie attendue :

```
✔  Deploy complete!

Hosting URL: https://your-project.web.app
```

### 7.2 Déploiement via GitHub Actions (Automatique)

Si vous avez activé GitHub Actions, chaque push sur `main` déclenchera :

1. Build automatique
2. Tests (si configurés)
3. Déploiement sur Firebase Hosting

Voir `.github/workflows/firebase-hosting-merge.yml`

### 7.3 Prévisualisation (Pull Requests)

Pour chaque PR, Firebase créera une URL de prévisualisation unique :

```
https://your-project--pr-123-hash.web.app
```

## 8. Configuration Avancée

### 8.1 Domaine personnalisé

1. Aller dans Firebase Console > Hosting
2. Cliquer sur "Ajouter un domaine personnalisé"
3. Entrer votre domaine (ex: `digcomp.lyon2.fr`)
4. Suivre les instructions DNS

### 8.2 Redirections et Rewrites

Éditez `firebase.json` :

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=7200"
          }
        ]
      }
    ]
  }
}
```

### 8.3 Environnements multiples

```bash
# Créer un alias pour staging
firebase use --add
# Sélectionner un projet staging
# Nommer l'alias: staging

# Déployer sur staging
firebase use staging
firebase deploy --only hosting

# Déployer sur production
firebase use production
firebase deploy --only hosting
```

## 9. Monitoring

### 9.1 Firebase Console

- **Performance Monitoring** : Temps de chargement
- **Analytics** : Utilisation de l'app
- **Crashlytics** : Erreurs JavaScript

### 9.2 Logs

```bash
# Voir les logs de déploiement
firebase hosting:channel:list

# Voir les logs Firebase Functions (si vous en ajoutez)
firebase functions:log
```

## 10. Rollback

### 10.1 Revenir à une version précédente

1. Aller dans Firebase Console > Hosting
2. Cliquer sur "Historique des versions"
3. Trouver la version souhaitée
4. Cliquer sur "..." > "Restaurer"

### 10.2 Via CLI

```bash
# Lister les versions
firebase hosting:releases:list

# Revenir à une version spécifique
# (pas de commande directe, utiliser la console)
```

## 11. Checklist de Déploiement

Avant chaque déploiement :

- [ ] Tests passent (`npm run test`)
- [ ] Build réussit (`npm run build`)
- [ ] Variables d'env configurées
- [ ] Firestore rules mises à jour
- [ ] Changelog mis à jour
- [ ] Version incrémentée (`package.json`)

## 12. Troubleshooting

### Erreur: "Permission denied"

```bash
firebase login --reauth
```

### Erreur: "Project not found"

```bash
firebase use --add
# Sélectionner le bon projet
```

### Build échoue

```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
```

### Firestore connection fails

- Vérifier que Firestore est activé
- Vérifier les règles de sécurité
- Vérifier les variables d'environnement

## 13. Coûts

Firebase propose un plan gratuit (Spark) limité :

- **Hosting** : 10 GB stockage, 360 MB/jour transfert
- **Firestore** : 50k lectures, 20k écritures, 20k suppressions/jour
- **Auth** : Illimité

Pour plus, passer au plan Blaze (pay-as-you-go).

## 14. Support

- [Documentation Firebase](https://firebase.google.com/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase Discord](https://discord.gg/firebase)

---

**Bon déploiement ! 🚀**
