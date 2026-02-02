# CLAUDE.md - Guide de développement DigComp v3

Ce fichier sert de référence technique pour Claude Code lors du développement sur ce projet.

## Commandes principales

### Développement
```bash
npm run dev          # Serveur de développement Vite (http://localhost:5173)
npm run build        # Build production (vue-tsc + vite build)
npm run preview      # Prévisualiser le build production
```

### Tests
```bash
npm run test              # Tests unitaires Vitest (mode watch)
npm run test:ui           # Interface UI Vitest
npm run test:coverage     # Couverture de code
npm run test:e2e          # Tests E2E Playwright
npm run test:e2e:ui       # Interface UI Playwright
npm run test:all          # Tous les tests (unitaires + E2E)
```

### Linting
```bash
npm run lint         # ESLint avec auto-fix (.vue, .ts, .js)
```

### Analyse
```bash
npm run analyze:bundle   # Analyser la taille du bundle
```

### Scripts Firebase
```bash
npm run import-news              # Import des actualités (prod)
npm run import-news-demo         # Import des actualités (demo)
npm run init-extended-gamification   # Initialiser gamification (prod)
```

---

## Standards de code

### TypeScript
- Typage strict obligatoire (pas de `any` sauf cas exceptionnels justifiés)
- Interfaces dans `src/types/index.ts`
- Variables non utilisées préfixées par `_`

### Vue.js
- **Composition API** exclusivement (pas d'Options API)
- **`<script setup lang="ts">`** pour tous les composants
- Nommage des composants en **PascalCase**
- Un composant = une responsabilité

### Structure des composants Vue
```vue
<script setup lang="ts">
// 1. Imports
// 2. Props/Emits
// 3. Composables
// 4. Refs/Reactive
// 5. Computed
// 6. Fonctions
// 7. Lifecycle hooks
</script>

<template>
  <!-- Template HTML -->
</template>

<style scoped>
/* Styles scopés */
</style>
```

### CSS / Tailwind
- Utiliser Tailwind CSS en priorité
- Classes utilitaires dans le template
- `<style scoped>` pour les styles complexes uniquement
- Support du dark mode via la classe `dark:`

### Stores Pinia
- Un store par domaine fonctionnel
- Actions asynchrones pour Firebase
- Getters pour les données dérivées

### Composables
- Préfixe `use` obligatoire (ex: `useToast`, `useGemini`)
- Retourner un objet avec les méthodes/refs exposées
- Documenter les paramètres et retours

### Firebase
- Requêtes optimisées (pagination, limites)
- Gestion des erreurs systématique
- Règles de sécurité Firestore respectées

---

## Architecture

> **Documentation détaillée** : Voir [architecture.md](architecture.md) pour les flux de données, la gestion des quotas Firebase et les diagrammes complets.

```
DigCompCNL2/
├── public/                    # Assets statiques
├── src/
│   ├── assets/               # Images, icônes
│   ├── components/           # Composants Vue réutilisables
│   │   ├── ai/              # Composants IA (Gemini)
│   │   ├── auth/            # Authentification, utilisateurs
│   │   ├── chat/            # Messagerie temps réel
│   │   ├── common/          # Header, Sidebar, Modal, Toast
│   │   ├── competences/     # Gestion des compétences DigComp
│   │   ├── comparison/      # Comparaison de versions
│   │   ├── dashboard/       # KPIs, graphiques
│   │   ├── gamification/    # Badges, achievements
│   │   ├── games/           # Mini-jeux éducatifs
│   │   ├── history/         # Audit, time machine
│   │   ├── kanban/          # Board Kanban
│   │   ├── review/          # Système de revue
│   │   └── video/           # Visioconférence (Jitsi)
│   ├── composables/         # Logique réutilisable (useXxx)
│   ├── directives/          # Directives Vue personnalisées
│   ├── firebase/            # Configuration Firebase
│   ├── router/              # Vue Router
│   ├── stores/              # Stores Pinia
│   │   ├── auth.ts          # Authentification
│   │   ├── chat.ts          # Messages
│   │   ├── competences.ts   # Données DigComp
│   │   ├── extendedGamification.ts
│   │   ├── news.ts          # Actualités
│   │   └── notifications.ts # Notifications push
│   ├── types/               # Interfaces TypeScript
│   ├── utils/               # Fonctions utilitaires
│   ├── views/               # Pages/routes principales
│   │   ├── CalendarView.vue
│   │   ├── ComparisonView.vue
│   │   ├── DashboardView.vue
│   │   ├── GamesView.vue
│   │   ├── GamificationView.vue
│   │   ├── KanbanView.vue
│   │   ├── LearningOutcomesView.vue
│   │   ├── OverviewView.vue
│   │   └── StatisticsView.vue
│   ├── __tests__/           # Tests unitaires
│   ├── App.vue              # Composant racine
│   ├── main.ts              # Point d'entrée
│   └── style.css            # Styles globaux Tailwind
├── functions/               # Firebase Cloud Functions
├── tests/                   # Tests E2E Playwright
├── scripts/                 # Scripts utilitaires
├── firebase.json            # Configuration Firebase
├── firestore.rules          # Règles de sécurité Firestore
├── firestore.indexes.json   # Index Firestore
├── vite.config.ts           # Configuration Vite
├── tailwind.config.js       # Configuration Tailwind
├── tsconfig.json            # Configuration TypeScript
├── vitest.config.ts         # Configuration Vitest
└── playwright.config.ts     # Configuration Playwright
```

### Flux de données
```
Firebase Firestore
       ↓
Pinia Stores (auth, competences, chat, news, notifications)
       ↓
Views (DashboardView, LearningOutcomesView, etc.)
       ↓
Components (OutcomeCard, KanbanBoard, ChatPanel, etc.)
       ↓
Composables (useToast, useGemini, useGamification, etc.)
```

### Collections Firestore principales
- `users/` - Utilisateurs et préférences
- `digcomp_data/` - Données du référentiel DigComp
- `messages/` - Chat temps réel
- `audit_logs/` - Historique des modifications
- `snapshots/` - Sauvegardes time machine
- `activity_feed/` - Flux d'activité

---

## Technologies

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Vue 3 (Composition API) |
| Langage | TypeScript |
| State | Pinia |
| Styling | Tailwind CSS |
| Build | Vite |
| Backend | Firebase (Auth, Firestore) |
| IA | Google Gemini |
| Graphiques | Chart.js, Plotly.js |
| Tests | Vitest, Playwright |
| Icônes | Phosphor Icons |

---

## Règles de collaboration avec Claude Code

### Avant toute modification majeure

**OBLIGATOIRE** : Proposer un plan d'action avant d'implémenter des changements significatifs.

Une modification est considérée comme "majeure" si elle :
- Touche plus de 3 fichiers
- Modifie la structure d'un store ou d'un composable
- Ajoute une nouvelle fonctionnalité
- Modifie les règles Firebase ou la structure des données
- Impacte les performances ou la sécurité

**Format du plan d'action** :
1. **Contexte** : Résumé de la demande
2. **Fichiers impactés** : Liste des fichiers à modifier/créer
3. **Approche** : Description technique de l'implémentation
4. **Risques** : Points d'attention potentiels
5. **Tests** : Tests à ajouter/modifier

### Bonnes pratiques
- Toujours lire les fichiers existants avant modification
- Respecter les patterns existants dans le code
- Ne pas créer de fichiers markdown inutiles
- Privilégier les modifications minimales
- Tester localement après modification (`npm run dev`, `npm run lint`)

### Convention de commits
```
<type>: <description courte>

Types: feat, fix, refactor, style, docs, test, chore
```
