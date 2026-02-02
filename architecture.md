# Architecture DigComp v3

> **Dernière mise à jour :** 2 février 2026
> **Version :** 1.0
> Ce fichier doit être mis à jour par Claude Code lors de modifications architecturales.

---

## Vue d'ensemble

DigComp v3 est une application Vue.js 3 pour la gestion collaborative du référentiel européen de compétences numériques DigComp. Elle utilise Firebase comme backend (Auth + Firestore) et Google Gemini pour les fonctionnalités IA.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue 3)                         │
├─────────────────────────────────────────────────────────────────┤
│  Views → Components → Composables → Stores → Firebase/Gemini    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Firebase │   │  Gemini  │   │  Jitsi   │
        │Firestore │   │    AI    │   │   Meet   │
        │  + Auth  │   │          │   │          │
        └──────────┘   └──────────┘   └──────────┘
```

---

## Flux de données détaillé

### 1. Flux Principal : Compétences DigComp

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LECTURE DES DONNÉES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                      ┌─────────────────────┐
                      │   Firestore Cloud   │
                      │  digcomp_data/main  │
                      └──────────┬──────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌───────────────┐        ┌───────────────┐
            │ StaticCache   │◄───────│ Premier fetch │
            │ (24h TTL)     │        │   getDoc()    │
            └───────┬───────┘        └───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  competences  │
            │    Store      │
            │   (Pinia)     │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌──────────┐
│ Dashboard   │ │ Kanban  │ │ Outcomes │
│    View     │ │  View   │ │   View   │
└─────────────┘ └─────────┘ └──────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         ÉCRITURE DES DONNÉES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Component  │────▶│   Store     │────▶│  Firestore  │
│   Action    │     │   Action    │     │   setDoc    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
      ┌─────────────┐ ┌──────────┐ ┌──────────────┐
      │ audit_logs  │ │ activity │ │ notifications│
      │   addDoc    │ │  _feed   │ │    store     │
      └─────────────┘ └──────────┘ └──────────────┘
```

### 2. Flux Authentification

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  LoginForm   │────▶│  Auth Store  │────▶│ Firebase Auth│
│  Component   │     │              │     │ signInWith() │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ onAuthChange  │
                    │   Listener    │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
      ┌─────────────┐ ┌───────────┐ ┌───────────────┐
      │ users/{uid} │ │ userData  │ │ Notifications │
      │   Polling   │ │   ref     │ │    Store      │
      │    60s      │ │           │ │               │
      └─────────────┘ └───────────┘ └───────────────┘
```

### 3. Flux Chat Temps Réel

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            CHAT WORKFLOW                                    │
└────────────────────────────────────────────────────────────────────────────┘

  LECTURE (onSnapshot optimisé)           ÉCRITURE

┌─────────────┐                    ┌─────────────┐
│  messages/  │◄───onSnapshot──────│  ChatPanel  │
│ collection  │     (2s delay)     │  Component  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│ Chat Store  │                    │   addDoc    │
│  messages   │                    │  message    │
└──────┬──────┘                    └─────────────┘
       │
       ▼
┌─────────────┐
│ MessageList │
│ + Typing    │
└─────────────┘
```

### 4. Flux Intelligence Artificielle (Gemini)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           GEMINI AI WORKFLOW                                │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ AIAssistant  │────▶│  useGemini   │────▶│ Google Cloud │
│ / DataChat   │     │  Composable  │     │  Gemini API  │
│ / MagicImport│     │              │     │              │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
         ┌─────────────┐       ┌─────────────┐
         │ ai_history  │       │  Streaming  │
         │  Firestore  │       │  Response   │
         │ (useAICache)│       │             │
         └─────────────┘       └─────────────┘

Modèles utilisés :
- gemini-3-flash-preview : Génération rapide (cours, TD, QCM)
- gemini-2.5-pro : Analyse complexe (syllabus, magic import)
```

### 5. Flux Gamification

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        GAMIFICATION WORKFLOW                                │
└────────────────────────────────────────────────────────────────────────────┘

Actions utilisateur                    Système de points
        │                                      │
        ▼                                      ▼
┌───────────────┐  recordAction()   ┌───────────────┐
│ useGamification│─────────────────▶│   user_stats  │
│   Composable   │                  │   Firestore   │
└───────────────┘                   └───────┬───────┘
                                            │
              ┌─────────────────────────────┼─────────────────────┐
              ▼                             ▼                     ▼
      ┌───────────────┐           ┌───────────────┐     ┌───────────────┐
      │  leaderboard  │           │    badges     │     │   quests      │
      │   Polling 30s │           │               │     │  Polling 2min │
      └───────────────┘           └───────────────┘     └───────────────┘
```

---

## Gestion des Services Tiers et Quotas Firebase

### Stratégies d'Optimisation Implémentées

#### 1. Conversion onSnapshot → Polling

Les listeners temps réel (`onSnapshot`) ont été convertis en polling pour réduire les lectures :

| Collection | Stratégie | Intervalle | Économie |
|------------|-----------|------------|----------|
| `digcomp_data` | Cache 24h + onSnapshot | 30s | 90% |
| `users/{uid}` | Polling | 60s | -60 lectures/h |
| `locks` | Polling | 15min | -95% |
| `messages` | onSnapshot optimisé | 2s delay | -50% |
| `notifications` | Polling | 10s | -80% |
| `external_members` | Polling | 30min | -99% |
| `quests` | Polling | 2min | -50% |
| `shop_items` | Polling | 5min | -80% |
| `ai_history` | Polling | 5min | -80% |
| `audit_logs` | onSnapshot différé | 30min | -95% |

#### 2. Cache Multiniveau

```
┌────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE CACHE                             │
└────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  StaticCache    │    │ FirebaseOptim.  │    │  Pinia Store    │
│  (useStaticCache)│    │    Cache        │    │     Cache       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ digcomp: 24h    │    │ polling: 50%    │    │ Réactivité      │
│ news: 1h        │    │ du TTL          │    │ immédiate       │
│ shop_items: 1h  │    │                 │    │                 │
│ challenges: 30m │    │                 │    │                 │
│ user_stats: 10m │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                     │                      │
         └─────────────────────┴──────────────────────┘
                              │
                              ▼
                    Vérification séquentielle :
                    1. Pinia (mémoire)
                    2. StaticCache (TTL)
                    3. FirebaseOptimizer (TTL court)
                    4. Firestore (si tout expiré)
```

#### 3. Visibilité Tab (Background Throttling)

Quand l'onglet passe en arrière-plan, les intervalles sont multipliés :

```typescript
// src/composables/useFirebaseOptimizer.ts
BACKGROUND_MULTIPLIER = {
  messages: 4,      // 15s → 60s
  notifications: 3, // 30s → 90s
  competences: 3,   // 30s → 90s
  user_stats: 2,    // 60s → 120s
  leaderboard: 3,   // 60s → 180s
}
```

#### 4. Debouncing et Batching des Écritures

```typescript
// Debounce pour éviter les écritures rapides
debounceWrite(key, writeFn, 1000) // 1s délai

// Batching pour grouper les opérations
batchWrite(batchKey, operation, 2000) // 2s accumulation
```

### Configuration Multi-Environnement

```
┌────────────────────────────────────────────────────────────────┐
│                   MODES FIREBASE                                │
└────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌─────────────────┐
│   MODE PROD     │                    │   MODE DEMO     │
├─────────────────┤                    ├─────────────────┤
│ Variables .env  │                    │ Variables .env  │
│ _PROD suffixe   │                    │ _DEMO suffixe   │
│                 │                    │                 │
│ Projet Firebase │                    │ Projet Firebase │
│   principal     │                    │   secondaire    │
└─────────────────┘                    └─────────────────┘

Sélection : localStorage.getItem('firebase_mode')
```

### Recommandations pour le Développement

#### Éviter l'explosion des quotas

1. **Ne jamais utiliser onSnapshot sans raison** - Préférer le polling avec `useFirebaseOptimizer.startPolling()`

2. **Utiliser le cache statique** pour les données peu changeantes :
```typescript
const staticCache = useStaticCache()
const cached = staticCache.get<T>('key')
if (!cached) {
  const data = await fetchFromFirestore()
  staticCache.set('key', data, TTL_MS)
}
```

3. **Respecter les délais optimisés** définis dans `useOptimizedDelays.ts`

4. **Tester en local avec le monitoring** :
```bash
./scripts/analyze-firebase-performance.sh
```

#### Émulateurs Firebase (non configurés actuellement)

Pour les tests intensifs, configurer les émulateurs :

```bash
# Installation
firebase init emulators

# Lancement
firebase emulators:start

# Configuration dans le code
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}
```

---

## Architecture des Composants

### Hiérarchie des Vues

```
App.vue
├── Header.vue
├── Sidebar.vue
└── <router-view>
    ├── /dashboard → DashboardView.vue
    │   ├── KPICard.vue
    │   ├── ProgressChart.vue
    │   └── SunburstChart.vue
    │
    ├── /outcomes → LearningOutcomesView.vue
    │   ├── OutcomeCard.vue
    │   │   ├── StatusDropdown.vue
    │   │   ├── ResourceList.vue
    │   │   ├── CommentsList.vue
    │   │   └── TagManager.vue
    │   └── AssigneeManager.vue
    │
    ├── /kanban → KanbanView.vue
    │   ├── KanbanBoard.vue
    │   └── KanbanCard.vue
    │
    ├── /gamification → GamificationView.vue
    │   ├── BadgeGrid.vue
    │   ├── LeaderboardPanel.vue
    │   └── QuestList.vue
    │
    ├── /games → GamesView.vue
    │
    ├── /calendar → CalendarView.vue
    │
    └── /statistics → StatisticsView.vue
```

### Stores Pinia

| Store | Responsabilité | Collections Firestore |
|-------|---------------|----------------------|
| `auth` | Authentification, utilisateur courant, membres externes | `users/`, `external_members/` |
| `competences` | Données DigComp, locks, snapshots, audit | `digcomp_data/`, `locks/`, `snapshots/`, `audit_logs/` |
| `chat` | Messages temps réel, typing indicators | `messages/` |
| `notifications` | Notifications push et in-app | `notifications/` |
| `news` | Actualités | `news/` |
| `extendedGamification` | Quêtes, badges, shop, inventaire | `quests/`, `user_stats/`, `shop_items/`, `user_inventory/` |

### Composables Principaux

| Composable | Rôle |
|------------|------|
| `useFirebaseOptimizer` | Polling optimisé, cache, debounce |
| `useStaticCache` | Cache longue durée pour données statiques |
| `useOptimizedDelays` | Configuration centralisée des délais |
| `useGemini` | Interface Google Gemini AI |
| `useGamification` | Points, badges, actions |
| `useToast` | Notifications UI |
| `useDarkMode` | Thème sombre |

---

## Collections Firestore

```
Firestore Database
│
├── digcomp_data/
│   └── main_v2                    # Document unique avec toutes les compétences
│       ├── domains[]
│       │   ├── competences[]
│       │   │   └── outcomes[]
│       │   │       ├── mappings.L1/L2/L3
│       │   │       ├── assignees[]
│       │   │       ├── comments[]
│       │   │       └── tags[]
│       └── lastUpdated
│
├── users/{uid}
│   ├── email, displayName
│   ├── state (online/idle/offline)
│   ├── lastSeen
│   ├── prefSound, prefDesktop
│   ├── apiKey (Gemini)
│   └── pinned[]
│
├── external_members/{id}
│   ├── name, email, role
│   └── createdAt
│
├── messages/{id}
│   ├── text, sender, timestamp
│   ├── attachment?
│   └── reactions{}
│
├── notifications/{id}
│   ├── type, title, body
│   ├── targetUser, sender
│   ├── read, createdAt
│   └── data{}
│
├── locks/{outcomeId}
│   ├── user
│   └── timestamp
│
├── snapshots/{id}
│   ├── name, user, date
│   └── data[]
│
├── audit_logs/{id}
│   ├── timestamp, user, action
│   ├── targetId, year
│   └── oldVal, newVal
│
├── activity_feed/{id}
│   ├── user, action, detail
│   └── date
│
├── ai_history/{id}
│   ├── outcomeId, type, model
│   ├── content, timestamp
│   └── user
│
├── user_stats/{uid}
│   ├── points, level
│   ├── badges[], streak
│   └── lastAction
│
├── quests/{id}
│   ├── title, description
│   ├── type, target, reward
│   └── active
│
├── shop_items/{id}
│   ├── name, description
│   ├── price, type
│   └── available
│
├── user_inventory/{uid}
│   └── items[]
│
├── news/{id}
│   ├── title, content
│   ├── author, date
│   └── category
│
└── calendar_events/{id}
    ├── title, date, type
    └── outcomeIds[]
```

---

## Index Firestore Requis

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "targetUser", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "user_stats",
      "fields": [
        { "fieldPath": "points", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userQuests",
      "fields": [
        { "fieldPath": "oduleuserId", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Métriques de Performance Actuelles

| Métrique | Valeur | Objectif |
|----------|--------|----------|
| onSnapshot actifs | 16 | <20 |
| Lectures/jour estimées | ~28,500 | <30,000 |
| TTL cache DigComp | 24h | - |
| Délai moyen polling | 2min | - |
| Réduction vs baseline | -40% | -50% |

---

## Changelog Architecture

| Date | Modification | Fichiers impactés |
|------|--------------|-------------------|
| 02/02/2026 | Création initiale | architecture.md |

---

*Ce fichier est maintenu par Claude Code. Toute modification architecturale doit être reflétée ici.*
