# Structure du projet DigComp 3.0

## Arborescence complète

```
DigCompCNL2/
├── public/
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   ├── AIAssistant.vue          # Assistant IA pédagogique
│   │   │   ├── DataChat.vue             # Chat avec les données
│   │   │   └── SyllabusImport.vue       # Import syllabus
│   │   ├── auth/
│   │   │   ├── UserAvatar.vue           # Avatar coloré
│   │   │   └── UserList.vue             # Liste utilisateurs
│   │   ├── chat/
│   │   │   ├── ChatPanel.vue            # Panneau chat
│   │   │   ├── MessageBubble.vue        # Bulle message
│   │   │   └── TypingIndicator.vue      # Indicateur frappe
│   │   ├── common/
│   │   │   ├── Header.vue               # En-tête app
│   │   │   ├── LoginForm.vue            # Formulaire connexion
│   │   │   ├── Modal.vue                # Modal réutilisable
│   │   │   ├── Sidebar.vue              # Navigation
│   │   │   └── ToastContainer.vue       # Notifications
│   │   ├── competences/
│   │   │   ├── AssigneeManager.vue      # Gestion assignations
│   │   │   ├── CommentsList.vue         # Commentaires
│   │   │   ├── OutcomeCard.vue          # Carte compétence
│   │   │   ├── ResourceHunter.vue       # Chercheur ressources IA
│   │   │   ├── ResourceList.vue         # Liste ressources
│   │   │   ├── StatusDropdown.vue       # Dropdown statut
│   │   │   └── TagManager.vue           # Gestion tags
│   │   ├── dashboard/
│   │   │   ├── KPICard.vue              # Carte KPI
│   │   │   ├── ProgressChart.vue        # Chart.js
│   │   │   └── SunburstChart.vue        # Plotly sunburst
│   │   ├── history/
│   │   │   ├── ActivityFeed.vue         # Flux activité
│   │   │   ├── AuditLog.vue             # Historique modifs
│   │   │   └── TimeMachine.vue          # Snapshots
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.vue          # Board Kanban
│   │   │   └── KanbanCard.vue           # Carte draggable
│   │   └── video/
│   │       └── VideoConference.vue      # Jitsi Meet
│   ├── composables/
│   │   ├── useDarkMode.ts               # Mode sombre
│   │   ├── useGemini.ts                 # IA Gemini
│   │   ├── useMarkdown.ts               # Rendu markdown
│   │   └── useToast.ts                  # Notifications
│   ├── firebase/
│   │   └── config.ts                    # Config Firebase
│   ├── router/
│   │   └── index.ts                     # Vue Router
│   ├── stores/
│   │   ├── auth.ts                      # Store auth
│   │   ├── chat.ts                      # Store chat
│   │   └── competences.ts               # Store compétences
│   ├── types/
│   │   └── index.ts                     # Types TypeScript
│   ├── utils/
│   │   └── helpers.ts                   # Fonctions utilitaires
│   ├── views/
│   │   ├── CompetencesView.vue          # Vue L1/L2/L3
│   │   ├── DashboardView.vue            # Vue dashboard
│   │   ├── KanbanView.vue               # Vue Kanban
│   │   └── OverviewView.vue             # Vue d'ensemble
│   ├── App.vue                          # Composant racine
│   ├── main.ts                          # Point d'entrée
│   └── style.css                        # Styles globaux
├── .gitignore
├── COMPONENTS_CREATED.md                # Liste composants créés
├── INSTALLATION.md                      # Guide installation
├── README_COMPOSANTS.md                 # Documentation complète
├── STRUCTURE.md                         # Ce fichier
├── digcomp_v3_LO_fr_complet.json        # Données DigComp
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Statistiques

- **33 composants/views** créés
- **4483 lignes** de code TypeScript/Vue.js
- **9 catégories** de composants
- **3 stores** Pinia
- **4 composables** réutilisables

## Flux de données

```
Firebase Firestore
    ↓
Pinia Stores (auth, competences, chat)
    ↓
Views (Dashboard, Competences, Kanban, Overview)
    ↓
Components (OutcomeCard, KanbanBoard, ChatPanel, etc.)
    ↓
Composables (useToast, useGemini, etc.)
```

## Routes

```typescript
/               → DashboardView
/l1             → CompetencesView (year: L1)
/l2             → CompetencesView (year: L2)
/l3             → CompetencesView (year: L3)
/overview       → OverviewView
/kanban         → KanbanView
```

## Collections Firestore

```
users/                      # Utilisateurs
├── {uid}/
│   ├── email
│   ├── state (online/idle)
│   ├── lastSeen
│   ├── isTyping
│   ├── prefSound
│   ├── apiKey
│   └── pinned[]

digcomp_data/              # Données DigComp
├── main_v2/
│   ├── domains[]
│   └── lastUpdated

messages/                  # Messages chat
├── {messageId}/
│   ├── text
│   ├── sender
│   ├── timestamp
│   ├── attachment
│   └── reactions{}

locks/                     # Locks édition
├── {outcomeId}/
│   ├── user
│   └── timestamp

snapshots/                 # Snapshots
├── {snapshotId}/
│   ├── name
│   ├── user
│   ├── date
│   └── data[]

audit_logs/               # Historique
├── {logId}/
│   ├── timestamp
│   ├── user
│   ├── action
│   ├── targetId
│   ├── desc
│   ├── year
│   ├── oldVal
│   └── newVal

activity_feed/            # Activité
├── {activityId}/
│   ├── user
│   ├── action
│   ├── detail
│   └── date
```

## Technologies utilisées

### Frontend
- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS
- Vite

### State Management
- Pinia

### Backend
- Firebase Auth
- Firebase Firestore

### Graphiques
- Chart.js
- Plotly.js

### IA
- Google Gemini

### Autres
- Phosphor Icons
- Jitsi Meet
- Markdown-it
