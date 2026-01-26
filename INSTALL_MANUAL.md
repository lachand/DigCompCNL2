# 🔧 Installation Manuelle - Solutions au Problème de Timeout

## ⚠️ Problème Rencontré

`npm install` échoue avec un timeout réseau. Voici les solutions.

## 🎯 Solutions (par ordre de préférence)

### Solution 1: Installer Yarn (RECOMMANDÉ)

Yarn est souvent plus fiable que npm pour les installations :

```bash
# Installer Yarn globalement
sudo npm install -g yarn

# Installer les dépendances avec Yarn
yarn install
```

Si ça fonctionne, lancez ensuite :
```bash
npm run dev
```

---

### Solution 2: npm avec Cache & Registry Alternatif

```bash
# Configurer npm pour utiliser un registry alternatif
npm config set registry https://registry.npmmirror.com

# Ou revenir au registry officiel
npm config set registry https://registry.npmjs.org

# Augmenter les timeouts
npm config set fetch-timeout 600000
npm config set fetch-retries 10

# Nettoyer le cache
npm cache clean --force

# Réessayer
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

### Solution 3: Installation Par Morceaux

Installez les dépendances une par une :

```bash
# Nettoyer
rm -rf node_modules package-lock.json

# 1. Dépendances Vue essentielles
npm install vue@3.5.13 --legacy-peer-deps
npm install vue-router@4.4.5 --legacy-peer-deps
npm install pinia@2.2.6 --legacy-peer-deps

# 2. Firebase
npm install firebase@10.14.0 --legacy-peer-deps
npm install vuefire@3.2.0 --legacy-peer-deps

# 3. UI et Styles
npm install tailwindcss@3.4.16 --save-dev --legacy-peer-deps
npm install autoprefixer@10.4.20 postcss@8.4.49 --save-dev --legacy-peer-deps

# 4. Build tools
npm install vite@6.0.3 --save-dev --legacy-peer-deps
npm install @vitejs/plugin-vue@5.2.1 --save-dev --legacy-peer-deps

# 5. TypeScript
npm install typescript@~5.6.3 --save-dev --legacy-peer-deps
npm install vue-tsc@2.1.10 --save-dev --legacy-peer-deps

# 6. Autres dépendances importantes
npm install @google/generative-ai@0.21.0 --legacy-peer-deps
npm install chart.js@4.4.6 --legacy-peer-deps
npm install markdown-it@14.1.0 --legacy-peer-deps
npm install diff@5.2.0 --legacy-peer-deps

# 7. PDF et Excel
npm install jspdf@2.5.2 --legacy-peer-deps
npm install jspdf-autotable@3.8.4 --legacy-peer-deps
npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz --legacy-peer-deps

# 8. Graphiques
npm install plotly.js-dist-min@2.35.2 --legacy-peer-deps

# 9. Icons
npm install @phosphor-icons/vue@2.2.1 --legacy-peer-deps

# 10. Tests (optionnel, pour plus tard)
npm install vitest@1.6.0 @vitest/ui@1.6.0 happy-dom@14.12.0 @vue/test-utils@2.4.6 --save-dev --legacy-peer-deps

# 11. ESLint (optionnel)
npm install eslint@9.15.0 eslint-plugin-vue@9.31.0 --save-dev --legacy-peer-deps

# 12. Types
npm install @types/node@22.10.2 @types/markdown-it@14.1.2 --save-dev --legacy-peer-deps
```

---

### Solution 4: Proxy ou VPN

Si vous êtes derrière un proxy d'entreprise :

```bash
# Configurer le proxy
npm config set proxy http://proxy.example.com:8080
npm config set https-proxy http://proxy.example.com:8080

# Ou désactiver le proxy
npm config delete proxy
npm config delete https-proxy

# Réessayer
npm install --legacy-peer-deps
```

Si vous avez un VPN, essayez de :
- Le désactiver temporairement
- Ou le réactiver si désactivé

---

### Solution 5: Utiliser un Gestionnaire de Paquets Alternatif

#### pnpm (rapide et efficace)

```bash
# Installer pnpm
npm install -g pnpm

# Installer les dépendances
pnpm install
```

#### Bun (très rapide, moderne)

```bash
# Installer Bun
curl -fsSL https://bun.sh/install | bash

# Installer les dépendances
bun install

# Lancer le serveur
bun run dev
```

---

### Solution 6: Installation Hors Ligne (Si vous avez accès à un autre PC)

Sur un PC avec une bonne connexion :

```bash
# 1. Cloner le projet
git clone [votre-repo]
cd DigCompCNL2

# 2. Installer les dépendances
npm install --legacy-peer-deps

# 3. Créer une archive de node_modules
tar -czf node_modules.tar.gz node_modules/
```

Transférer `node_modules.tar.gz` sur votre PC et :

```bash
# Extraire
tar -xzf node_modules.tar.gz

# Lancer
npm run dev
```

---

## ✅ Vérifier l'Installation

Une fois les dépendances installées, vérifiez :

```bash
# 1. Vérifier que node_modules existe
ls node_modules/ | wc -l
# Devrait afficher environ 500-800 dossiers

# 2. Vérifier les dépendances principales
npm list vue vue-router pinia firebase vuefire

# 3. Essayer de lancer le serveur
npm run dev
```

---

## 🚀 Lancer l'Application

```bash
npm run dev
```

Ouvrir **http://localhost:5173**

---

## 🐛 Si le Serveur de Dev Ne Démarre Pas

### Erreur: "Cannot find module 'vite'"

```bash
npm install vite@6.0.3 --save-dev --legacy-peer-deps
```

### Erreur: "Cannot find module 'vue'"

```bash
npm install vue@3.5.13 --legacy-peer-deps
```

### Erreur TypeScript

```bash
# Installer TypeScript
npm install typescript@~5.6.3 --save-dev --legacy-peer-deps

# Ignorer les erreurs TypeScript temporairement
npm run dev -- --host
```

---

## 📦 Dépendances Minimales pour Démarrer

Si vous voulez juste tester rapidement, installez seulement :

```bash
# Core
npm install vue@3.5.13 vue-router@4.4.5 pinia@2.2.6

# Firebase
npm install firebase@10.14.0 vuefire@3.2.0

# Build
npm install vite@6.0.3 @vitejs/plugin-vue@5.2.1 --save-dev

# TypeScript
npm install typescript@~5.6.3 vue-tsc@2.1.10 --save-dev

# Styles
npm install tailwindcss@3.4.16 autoprefixer@10.4.20 postcss@8.4.49 --save-dev

# Puis lancez
npm run dev
```

Les autres dépendances (Chart.js, Plotly, etc.) peuvent être installées plus tard.

---

## 🆘 Support

Si aucune solution ne fonctionne :

1. **Vérifiez votre connexion Internet**
   ```bash
   ping registry.npmjs.org
   ```

2. **Vérifiez votre version de Node.js**
   ```bash
   node --version  # Doit être >= 18
   npm --version   # Doit être >= 9
   ```

3. **Réinstallez Node.js** si les versions sont anciennes
   - Téléchargez depuis https://nodejs.org/
   - Version LTS recommandée (20.x)

4. **Utilisez Docker** (solution ultime)
   ```bash
   # Créer un Dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --legacy-peer-deps
   COPY . .
   CMD ["npm", "run", "dev"]

   # Builder et lancer
   docker build -t digcomp .
   docker run -p 5173:5173 digcomp
   ```

---

**Une fois installé, consultez [NEXT_STEPS.md](./NEXT_STEPS.md) pour la suite ! 🚀**
