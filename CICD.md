# Configuration CI/CD - GitHub Actions

Ce guide explique la configuration complète CI/CD du projet DigComp 3.0.

## 📋 Vue d'ensemble

Le projet utilise **GitHub Actions** pour automatiser :
- ✅ Tests automatiques sur chaque push/PR
- ✅ Linting et vérification du code
- ✅ Build et déploiement sur Firebase Hosting
- ✅ Déploiement sur GitHub Pages
- ✅ Prévisualisation des Pull Requests

## 🔧 Workflows Configurés

### 1. CI (Intégration Continue)

**Fichier**: `.github/workflows/ci.yml`

**Déclencheurs**:
- Push sur `main` et `develop`
- Pull Requests vers `main` et `develop`

**Actions**:
1. Checkout du code
2. Installation de Node.js (18.x et 20.x)
3. Installation des dépendances (`npm ci`)
4. Linting (`npm run lint`)
5. Tests (`npm run test`)
6. Build (`npm run build`)
7. Upload coverage vers Codecov

**Exemple**:
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

### 2. Firebase Hosting Deployment

**Fichier**: `.github/workflows/firebase-hosting.yml`

**Déclencheur**: Push sur `main`

**Actions**:
1. Build de l'application
2. Déploiement sur Firebase Hosting (channel live)

**Variables d'environnement requises (GitHub Secrets)**:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_URL`
- `FIREBASE_SERVICE_ACCOUNT`

### 3. Firebase Hosting Preview (Pull Requests)

**Fichier**: `.github/workflows/firebase-hosting-pull-request.yml`

**Déclencheur**: Pull Request vers `main`

**Actions**:
1. Build de l'application
2. Déploiement sur un channel de prévisualisation Firebase
3. Ajout d'un commentaire sur la PR avec l'URL de prévisualisation

**Exemple d'URL**: `https://digcomp--pr-123-abc123.web.app`

### 4. GitHub Pages Deployment

**Fichier**: `.github/workflows/github-pages.yml`

**Déclencheur**: Push sur `main`

**Actions**:
1. Build de l'application
2. Upload des artifacts
3. Déploiement sur GitHub Pages

**URL finale**: `https://votre-username.github.io/digcomp-v3/`

## 🔑 Configuration des Secrets GitHub

### Étape 1: Aller dans les paramètres

1. Aller sur votre repository GitHub
2. Cliquer sur `Settings` > `Secrets and variables` > `Actions`
3. Cliquer sur `New repository secret`

### Étape 2: Ajouter les secrets Firebase

Ajoutez les secrets suivants (valeurs depuis `.env`):

| Secret Name | Description | Exemple |
|-------------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Clé API Firebase | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine Auth | `projet.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet | `mon-projet-123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Storage | `projet.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID | `1:123:web:abc` |
| `VITE_FIREBASE_DATABASE_URL` | Database URL | `https://projet.firebaseio.com` |

### Étape 3: Créer le Service Account Firebase

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Créer le service account
firebase init hosting:github

# Suivre les instructions
# Cela créera automatiquement le secret FIREBASE_SERVICE_ACCOUNT
```

Ou manuellement :

1. Aller dans [Firebase Console](https://console.firebase.google.com/)
2. Paramètres du projet > Comptes de service
3. Créer un compte de service
4. Télécharger la clé JSON
5. Copier tout le contenu JSON dans un secret `FIREBASE_SERVICE_ACCOUNT`

## 📊 Badge de Status

Ajoutez des badges dans votre README.md :

```markdown
![CI](https://github.com/username/digcomp-v3/workflows/CI/badge.svg)
![Deploy](https://github.com/username/digcomp-v3/workflows/Deploy%20to%20Firebase%20Hosting/badge.svg)
[![codecov](https://codecov.io/gh/username/digcomp-v3/branch/main/graph/badge.svg)](https://codecov.io/gh/username/digcomp-v3)
```

## 🧪 Tests Automatiques

### Configuration Vitest

Le projet utilise **Vitest** pour les tests unitaires.

**Configuration**: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Lancer les tests localement

```bash
# Tests en mode watch
npm run test

# Tests avec UI
npm run test:ui

# Tests avec coverage
npm run test:coverage
```

### Couverture de code

Les rapports de couverture sont automatiquement envoyés à [Codecov](https://codecov.io/) après chaque push sur `main`.

Pour configurer Codecov :

1. Aller sur [codecov.io](https://codecov.io/)
2. Connecter votre repository GitHub
3. Pas besoin de secret supplémentaire (utilise `CODECOV_TOKEN` auto-généré)

## 🚀 Déploiement Manuel

### Firebase Hosting

```bash
# Build
npm run build

# Déployer
firebase deploy --only hosting
```

### GitHub Pages

GitHub Pages se déploie automatiquement, mais vous pouvez forcer :

```bash
# Dans l'onglet Actions du repository
# Cliquer sur "Deploy to GitHub Pages" > "Run workflow"
```

## 🔍 Monitoring et Logs

### GitHub Actions Logs

1. Aller sur `Actions` dans votre repository
2. Sélectionner un workflow
3. Cliquer sur un run spécifique
4. Voir les logs détaillés de chaque step

### Firebase Logs

```bash
# Logs de déploiement
firebase hosting:channel:list

# Logs en temps réel (si Functions)
firebase functions:log
```

## 🐛 Troubleshooting

### Workflow échoue : "Error: No Firebase project selected"

**Solution**:
```bash
firebase use --add
# Sélectionner votre projet
```

### Workflow échoue : "Error: Insufficient permissions"

**Solution**: Vérifier que le service account Firebase a les permissions nécessaires :
- Firebase Hosting Admin
- Cloud Datastore User

### Build échoue : "Module not found"

**Solution**:
```bash
# Nettoyer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Tests échouent en CI mais passent localement

**Solution**: Vérifier la version de Node.js

```yaml
# Utiliser la même version que localement
- uses: actions/setup-node@v4
  with:
    node-version: '20'
```

## 📈 Optimisations

### Cache des dépendances

Les workflows utilisent déjà le cache npm :

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Cache automatique
```

### Parallélisation

Les tests s'exécutent sur plusieurs versions de Node.js en parallèle :

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

### Conditions pour éviter les runs inutiles

```yaml
on:
  push:
    branches: [ main ]
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Vitest Documentation](https://vitest.dev/)
- [Codecov Documentation](https://docs.codecov.com/)

## 🎯 Checklist CI/CD

- [ ] GitHub Secrets configurés
- [ ] Firebase Service Account créé
- [ ] Workflows fonctionnent
- [ ] Tests passent en CI
- [ ] Déploiement Firebase fonctionne
- [ ] Déploiement GitHub Pages fonctionne
- [ ] Badges ajoutés au README
- [ ] Codecov configuré (optionnel)

---

**Votre CI/CD est maintenant prêt ! 🎉**
