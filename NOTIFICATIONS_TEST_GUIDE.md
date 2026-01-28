# 🔔 Guide de Test - Système de Notifications

## ✅ Vérification Rapide

### 1. Vérifier que le système est actif
1. Ouvrez l'application dans un navigateur
2. Cliquez sur la cloche 🔔 dans le header
3. Vous devriez voir "Aucune notification" avec un message d'aide

### 2. Tester une assignation
1. Allez à un LO
2. Ouvrez la liste des utilisateurs (dans les assignees)
3. Assignez un autre utilisateur au LO
4. Cet utilisateur devrait recevoir une notification immédiate

### 3. Tester une deadline
1. Ouvrez un LO
2. Cliquez sur "Définir deadline"
3. Saisissez une date et un label
4. Tous les utilisateurs assignés reçoivent une notification

### 4. Tester une demande de review
1. Ouvrez un LO
2. Cliquez sur "Demander une review"
3. Sélectionnez un reviewer
4. Le reviewer reçoit une notification

## 🧪 Test Multi-Navigateur

Pour tester correctement avec deux utilisateurs :

### Setup
1. Ouvrez deux sessions du navigateur (ou utiliser Mode Privé)
   - Session 1 : Utilisateur A
   - Session 2 : Utilisateur B

2. Dans Session 1 (Utilisateur A) :
   - Connectez-vous avec user1@example.com
   - Allez à /outcomes ou /l1

3. Dans Session 2 (Utilisateur B) :
   - Connectez-vous avec user2@example.com
   - Placez cette fenêtre côte à côte

### Test Scenario 1: Assignation
1. Dans Session 1, ouvrez un LO non assigné
2. Cliquez sur les assignees
3. Assignez User B au LO
4. Dans Session 2, cliquez sur la cloche 🔔
5. ✅ Vous devriez voir: "user1 vous a assigné au LO XXX (YYY)"

### Test Scenario 2: Deadline
1. Dans Session 1, ouvrez un LO assigné à User B
2. Cliquez sur "Définir deadline"
3. Mettez une date et label
4. Dans Session 2, cliquez sur la cloche 🔔
5. ✅ Vous devriez voir une notification de deadline

### Test Scenario 3: Review
1. Dans Session 1, ouvrez un LO
2. Cliquez sur "Demander une review"
3. Sélectionnez User B
4. Dans Session 2, cliquez sur la cloche 🔔
5. ✅ Vous devriez voir: "user1 demande votre review pour XXX (YYY)"

### Test Scenario 4: Status Change
1. Dans Session 1, ouvrez un LO assigné à User B
2. Changez le statut (ex: de "draft" à "in_progress")
3. Dans Session 2, cliquez sur la cloche 🔔
4. ✅ Vous devriez voir: "user1 a changé le statut..."

### Test Scenario 5: Comment
1. Dans Session 1, ouvrez un LO assigné à User B
2. Ajoutez un commentaire
3. Dans Session 2, cliquez sur la cloche 🔔
4. ✅ Vous devriez voir: "user1 a commenté XXX: ..."

## 🔍 Debug dans la Console

Pour vérifier les notifications en temps réel :

```javascript
// Ouvrez la console (F12)
// Importez le composable de debug
const app = document.querySelector('main').__vue__

// Ou utilisez les stores directement
import { useNotificationsStore } from '@/stores/notifications'
const store = useNotificationsStore()

// Afficher les notifications
console.log(store.sortedNotifications)
console.log('Unread:', store.unreadCount)

// Créer une notification de test
await store.createNotification({
  type: 'assignment',
  title: 'Test',
  message: 'Ceci est un test',
  targetUser: 'your-email@example.com',
  createdBy: 'test@example.com'
})
```

## 📊 Vérifier dans Firestore

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet
3. Allez à Firestore Database
4. Cliquez sur "Collections" > "notifications"
5. Vous devriez voir des documents comme :
```
{
  targetUser: "user2@example.com",
  createdBy: "user1@example.com",
  type: "assignment",
  title: "Nouvelle assignation",
  message: "user1 vous a assigné au LO 1.1.1 (L1)",
  outcomeId: "1.1.1",
  year: "L1",
  createdAt: 1234567890,
  read: false,
  link: "/outcomes?lo=1.1.1"
}
```

## ✨ Types de Notifications Supportés

| Type | Déclencheur | Exemple |
|------|-------------|---------|
| `assignment` | Assignation à un LO | "user1 vous a assigné au LO 1.1.1" |
| `deadline` | Deadline assignée | "user1 a assigné une deadline ... le 25/01/2026" |
| `review` | Demande de review | "user1 demande votre review pour 1.1.1" |
| `status_change` | Changement de statut | "user1 a changé le statut du LO 1.1.1 à Validé" |
| `comment` | Commentaire ajouté | "user1 a commenté 1.1.1: Très bon..." |

## 🚀 Prochaines Étapes

- [ ] Ajouter des sons de notification
- [ ] Ajouter les notifications push du navigateur
- [ ] Ajouter les notifications email
- [ ] Filtrer les notifications par type
- [ ] Archiver les anciennes notifications
- [ ] Ajouter les logs de lecture pour analytics

## 📝 Notes

- Les notifications se mettent à jour en **temps réel** grâce à Firestore's `onSnapshot()`
- Les notifications non-lues affichent un badge rouge avec le compte
- Cliquer sur une notification marque la notification comme lue et navigue vers la ressource
- Les notifications sont limitées à 100 documents pour optimiser les performances
