# Système de Notifications - Configuration et Test

## 🔔 Améliorations Apportées

### 1. **Types de Notifications Étendus**
Le système supporte désormais les types suivants :
- `assignment` - Quand vous êtes assigné à un LO
- `deadline` - Quand une deadline vous est assignée
- `review` - Quand une review vous est demandée ou résolue
- `status_change` - Quand le statut d'un LO change
- `comment` - Quand quelqu'un commente un LO
- `mention` - Pour les mentions spéciales

### 2. **Notifications Automatiques**
Les notifications sont créées automatiquement lors de :

#### ✅ Assignation à un LO
```
Quand : Quelqu'un vous assigne à un LO
Message : "{User} vous a assigné au LO 1.1.1 (L1)"
Lien : /outcomes?lo=1.1.1
```

#### ✅ Changement de Deadline
```
Quand : Quelqu'un vous assigne une deadline
Message : "{User} vous a assigné une deadline pour LO 1.1.1 (L1): "Label" le DD/MM/YYYY"
Lien : /calendar
```

#### ✅ Demande de Review
```
Quand : Quelqu'un vous demande une review
Message : "{User} demande votre review pour LO 1.1.1 (L1)"
Lien : /outcomes?lo=1.1.1
```

#### ✅ Résultat de Review
```
Quand : Une review est approuvée/rejetée
Message : "{User} a approuvé/rejeté votre review pour LO 1.1.1 (L1)"
Lien : /outcomes?lo=1.1.1
```

#### ✅ Changement de Statut
```
Quand : Le statut d'un LO change
Message : "{User} a changé le statut du LO 1.1.1 (L1) à "Validé""
Lien : /outcomes?lo=1.1.1
```

#### ✅ Nouveau Commentaire
```
Quand : Quelqu'un commente un LO auquel vous êtes assigné
Message : "{User} a commenté 1.1.1: "Commentaire..."
Lien : /outcomes?lo=1.1.1
```

## 🧪 Testing des Notifications

### Option 1: Tester Manuellement en Développement

Ouvrez la console du navigateur et exécutez :

```javascript
// Importer le composable de debug
import { useNotificationDebug } from '@/composables/useNotificationDebug'

// Dans votre composant Vue
const { createTestNotifications, logNotifications } = useNotificationDebug()

// Créer des notifications de test
await createTestNotifications()

// Afficher le debug
logNotifications()
```

### Option 2: Tester en Simulation

1. Ouvrez deux onglets avec deux utilisateurs différents
2. Dans l'onglet 1 (User A):
   - Assignez User B à un LO
   - Changez le statut d'un LO
   - Assignez une deadline
3. Dans l'onglet 2 (User B):
   - Les notifications devraient apparaître en temps réel dans le Header

### Option 3: Tester avec Firestore

1. Allez sur https://console.firebase.google.com
2. Ouvrez votre projet
3. Allez dans Firestore Database
4. Vérifiez la collection `notifications`
5. Les documents devraient avoir :
   - `targetUser` : email du destinataire
   - `createdBy` : email de celui qui crée la notification
   - `createdAt` : timestamp
   - `read` : false pour les non-lues

## 🐛 Troubleshooting

### Les notifications ne s'affichent pas

1. **Vérifiez l'authentification** :
   ```javascript
   const { currentUser } = useAuthStore()
   console.log('User:', currentUser?.email)
   ```

2. **Vérifiez le chargement** :
   ```javascript
   const { sortedNotifications } = useNotificationsStore()
   console.log('Notifications:', sortedNotifications)
   ```

3. **Vérifiez Firestore** :
   - Allez dans Firestore > Collections > notifications
   - Cherchez les documents avec votre email en `targetUser`

4. **Vérifiez les erreurs console** :
   - Ouvrez F12 > Console
   - Regardez les erreurs Firebase

### Les notifications n'arrivent pas en temps réel

1. Vérifiez que `loadNotifications()` est appelé dans `App.vue`
2. Vérifiez que vous n'êtes pas en mode incognito
3. Vérifiez les règles Firestore dans `firestore.rules`

## 📝 Ajouter une Nouvelle Notification

Pour ajouter un nouveau type de notification :

1. Ajoutez le type dans `types/index.ts` ou dans le store `notifications.ts`
2. Créez une fonction `notifyXXX()` dans `stores/notifications.ts`
3. Appelez-la où nécessaire (ex: dans `stores/competences.ts`)
4. Ajoutez l'icône et les couleurs dans `Header.vue`

Exemple :
```typescript
const notifyMyEvent = async (
  outcomeId: string,
  targetEmail: string,
  creatorEmail: string
) => {
  await createNotification({
    type: 'myevent',
    title: 'Mon Événement',
    message: `${creatorEmail} a créé un événement pour ${outcomeId}`,
    outcomeId,
    targetUser: targetEmail,
    createdBy: creatorEmail,
    link: '/path'
  })
}
```

## 🔐 Production Notes

Les règles Firestore actuelles permettent à tous les utilisateurs authentifiés de lire/écrire.
En production, restrictive les permissions :

```
match /notifications/{document=**} {
  allow read: if request.auth.uid != null && 
              resource.data.targetUser == request.auth.token.email;
  allow create: if request.auth.uid != null;
}
```
