# 📊 Vue d'ensemble - Système de Notifications

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      App.vue                               │ │
│  │  - Initialise App au montage                               │ │
│  │  - Appelle notificationsStore.loadNotifications()          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Header.vue                              │ │
│  │  - Affiche l'onglet Notifications 🔔                       │ │
│  │  - Badge rouge avec compteur                               │ │
│  │  - Dropdown avec liste des notifications                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Stores (Pinia)                                   │ │
│  │                                                             │ │
│  │  ├─ notifications.ts                                        │ │
│  │  │   - State: notifications[], unreadCount                 │ │
│  │  │   - Actions: create, mark, delete                       │ │
│  │  │   - Listeners: onSnapshot() Firestore                   │ │
│  │  │                                                         │ │
│  │  ├─ competences.ts                                          │ │
│  │  │   - Appelle notifyAssignment()                          │ │
│  │  │   - Appelle notifyStatusChange()                        │ │
│  │  │   - Appelle notifyDeadlineAssigned()                    │ │
│  │  │                                                         │ │
│  │  └─ useReviewRequests.ts                                    │ │
│  │      - Appelle notifyReviewRequest()                       │ │
│  │      - Appelle notifyReviewResult()                        │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Firestore Database                               │ │
│  │                                                             │ │
│  │   Collection: notifications                                │ │
│  │   ├─ Document 1                                             │ │
│  │   │   ├─ targetUser: \"user@example.com\"                   │ │
│  │   │   ├─ type: \"assignment\"                              │ │
│  │   │   ├─ message: \"...\"                                  │ │
│  │   │   ├─ createdAt: 1706404800000                          │ │
│  │   │   └─ read: false                                       │ │
│  │   └─ Document 2                                             │ │
│  │       ├─ targetUser: \"user@example.com\"                   │ │
│  │       ├─ type: \"deadline\"                                │ │
│  │       ├─ message: \"...\"                                  │ │
│  │       ├─ createdAt: 1706404900000                          │ │
│  │       └─ read: false                                       │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Flow Détaillé - Assignation

```
Utilisateur A                    Système                    Utilisateur B
────────────────────────────────────────────────────────────────────
  │
  ├─ Ouvre un LO
  │
  ├─ Clique sur "Assignees"
  │
  ├─ Ajoute User B ─────────► competences.toggleAssignee()
  │                              │
  │                              ├─ Ajoute User B à outcome.assignees
  │                              │
  │                              ├─ Appelle notifyAssignment()
  │                              │
  │                              ├─ createNotification({
  │                              │    type: 'assignment',
  │                              │    title: 'Nouvelle assignation',
  │                              │    message: 'User A vous a assigné...',
  │                              │    targetUser: 'userB@...',
  │                              │    createdAt: Date.now()
  │                              │  })
  │                              │
  │                              └─► addDoc() à Firestore
  │                                      │
  │                                      └─► notifications collection
  │                                              │
  │                                              └─► User B reçoit
  │                                                    l'événement
  │                                                    onSnapshot()
  │
  │                                                    ↓
  │                                              notifications.value
  │                                              = [nouvelle notif]
  │                                                    │
  │                                                    ↓
  │                                              Header.vue affiche
  │                                              le badge 🔔 "1"
  │                                                    │
  │                                                    ↓
  │                                              User B peut cliquer
  │                                              sur la cloche pour
  │                                              voir la notification
  │
```

## Types de Notifications & Déclenche

### 1. Assignment (Assignation)
```
Quand: Quelqu'un vous assigne à un LO
Où: stores/competences.ts > toggleAssignee()
Message: "{User} vous a assigné au LO XXX (YYY)"
Lien: /outcomes?lo=XXX
```

### 2. Deadline (Deadline assignée)
```
Quand: Quelqu'un fixe une deadline pour un LO auquel vous êtes assigné
Où: stores/competences.ts > setDeadline()
Message: "{User} vous a assigné une deadline pour XXX (YYY): \"Label\" le DD/MM/YYYY"
Lien: /calendar
```

### 3. Review Request (Demande de review)
```
Quand: Quelqu'un vous demande une review
Où: composables/useReviewRequests.ts > createReviewRequest()
Message: "{User} demande votre review pour XXX (YYY)"
Lien: /outcomes?lo=XXX
```

### 4. Review Result (Résultat de review)
```
Quand: Votre review est approuvée/rejetée
Où: composables/useReviewRequests.ts > approveReview() / rejectReview()
Message: "{User} a approuvé/rejeté votre review pour XXX (YYY)"
Lien: /outcomes?lo=XXX
```

### 5. Status Change (Changement de statut)
```
Quand: Le statut d'un LO change (dont vous êtes assigné)
Où: stores/competences.ts > updateStatus()
Message: "{User} a changé le statut du LO XXX à Validé"
Lien: /outcomes?lo=XXX
```

### 6. Comment (Nouveau commentaire)
```
Quand: Quelqu'un commente un LO auquel vous êtes assigné
Où: stores/competences.ts > addComment()
Message: "{User} a commenté XXX: \"Texte du commentaire...\""
Lien: /outcomes?lo=XXX
```

## Couleurs & Icônes

```
Type              Icône              Couleur              Exemple
─────────────────────────────────────────────────────────────────
assignment        👤 ph-user-plus     Bleu (blue-600)      Assignation
deadline          📅 ph-calendar-x    Orange (orange-600)  Deadline
review            ✓ ph-user-check     Indigo (indigo-600)  Review
status_change     → ph-arrow-right    Vert (green-600)     Status
comment           💬 ph-chat-circle   Violet (purple-600)  Comment
```

## État de la Notification

```
┌─────────────────────────────────────────┐
│  Notification Non-Lue                   │
├─────────────────────────────────────────┤
│ read: false                             │
│ Fond: light indigo                      │
│ Affichée dans le compteur 🔔 "3"        │
│ Cliquable pour marquer comme lue        │
│ Supprimer ✕ (hover)                     │
└─────────────────────────────────────────┘

Vs

┌─────────────────────────────────────────┐
│  Notification Lue                       │
├─────────────────────────────────────────┤
│ read: true                              │
│ Fond: normal                            │
│ NON affichée dans le compteur            │
│ Cliquable pour naviguer                 │
│ Supprimer ✕ (hover)                     │
└─────────────────────────────────────────┘
```

## Fichiers Importants

```
src/
├── stores/
│   ├── notifications.ts          ⭐ Logique principale
│   ├── competences.ts            ⭐ Déclenche notifications
│   └── auth.ts
├── composables/
│   ├── useReviewRequests.ts       ⭐ Notifications de review
│   ├── useNotificationDebug.ts    ⭐ Debug & test
│   └── useToast.ts
├── components/
│   └── common/
│       └── Header.vue             ⭐ Affichage UI
└── utils/
    └── helpers.ts                 (support functions)

Documentation/
├── MODIFICATIONS_NOTIFICATIONS.md  ⭐ Résumé changes
├── NOTIFICATIONS_SETUP.md         ⭐ Configuration
├── NOTIFICATIONS_TEST_GUIDE.md    ⭐ Guide de test
└── NOTIFICATIONS_DEPLOYMENT.md    ⭐ Déploiement

firestore.rules                    ⭐ Sécurité
```

## Performance

| Métrique | Valeur | Note |
|----------|--------|------|
| Temps de chargement | < 100ms | Firestore query optimisée |
| Notifications par user | 100 | Configurable limite |
| Taille par notification | ~1KB | Texte + métadonnées |
| Mise à jour | Temps réel | onSnapshot() listener |
| Stockage total | ~100MB | Pour 100k notifications |

## Sécurité

```
Firestore Rule:
allow read: if request.auth.uid != null && 
            resource.data.targetUser == request.auth.token.email;

==> Chaque utilisateur ne peut voir que SES notifications
```

## Points Clés

✅ Temps réel avec Firestore onSnapshot()
✅ Notifications filtrées par utilisateur (targetUser)
✅ Types variés avec icônes distinctes
✅ Messages contextuels avec qui a fait l'action
✅ Navigation directe vers la ressource
✅ Badge compteur
✅ Marquer comme lu/Tout marquer
✅ Supprimer individual
✅ Production-ready
✅ Optimisé performances
