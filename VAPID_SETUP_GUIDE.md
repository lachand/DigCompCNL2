# Configuration des Clés VAPID pour Firebase

## Qu'est-ce qu'une clé VAPID ?

VAPID (Voluntary Application Server Identification) est un protocole qui permet d'authentifier votre serveur d'application auprès des services push. Firebase Cloud Messaging (FCM) utilise ces clés pour envoyer des notifications push de manière sécurisée.

## Comment obtenir votre clé VAPID Firebase

### Étape 1 : Accéder à la Console Firebase

1. Rendez-vous sur [console.firebase.google.com](https://console.firebase.google.com)
2. Connectez-vous avec votre compte Google
3. Sélectionnez votre projet DigComp (ou créez-le si nécessaire)

### Étape 2 : Naviguer vers les paramètres du projet

1. Cliquez sur l'icône ⚙️ (Paramètres) en haut à gauche
2. Sélectionnez **"Paramètres du projet"**
3. Dans l'onglet **"Général"**, faites défiler jusqu'à la section **"Configuration SDK"**

### Étape 3 : Configurer Firebase pour le web

Si ce n'est pas déjà fait :
1. Cliquez sur **"Ajouter une application"** puis sur l'icône Web (`</>`)
2. Donnez un nom à votre app (ex: "DigComp CNL2")
3. Cochez **"Configurer aussi Firebase Hosting"** si vous utilisez Firebase Hosting
4. Cliquez sur **"Enregistrer l'application"**

### Étape 4 : Obtenir la clé VAPID

1. Restez dans **"Paramètres du projet"** > **"Général"**
2. Descendez jusqu'à la section **"Configuration SDK"**
3. Dans la sous-section **"Configuration"**, vous verrez votre configuration Firebase
4. Cliquez sur l'onglet **"Cloud Messaging"**
5. Vous y trouverez :
   - **Certificats de clé Web push** : c'est votre clé VAPID !
   - Si la section est vide, cliquez sur **"Générer une paire de clés"**

### Étape 5 : Copier la clé VAPID

La clé VAPID ressemble à ceci :
```
BBmr_example_key_here_0123456789abcdef...
```

## Configuration dans votre application

### Option 1 : Variables d'environnement (Recommandé)

1. Créez un fichier `.env.local` à la racine de votre projet :
```bash
VITE_FIREBASE_VAPID_KEY=votre_cle_vapid_ici
```

2. Dans votre configuration Firebase (`src/firebase/config.ts`), utilisez :
```typescript
export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
```

### Option 2 : Configuration directe

Dans `src/firebase/config.ts`, ajoutez votre clé :
```typescript
export const vapidKey = 'BBmr_votre_cle_vapid_ici...'
```

## Vérification de la configuration

### Dans le composable `usePushNotifications.ts`

Vérifiez que la clé VAPID est bien utilisée :

```typescript
import { vapidKey } from '@/firebase/config'

// Dans la fonction getToken
const token = await getToken(messaging, {
  vapidKey: vapidKey
})
```

### Test des notifications

1. Ouvrez votre application
2. Allez dans les paramètres utilisateur (cliquez sur votre avatar en haut à droite)
3. Déroulez la section **"Notifications Push"**
4. Cliquez sur **"Activer les notifications"**
5. Autorisez les notifications dans votre navigateur

## Résolution des problèmes courants

### Erreur "VAPID key is not set"
- Vérifiez que la clé VAPID est bien configurée dans `firebase/config.ts`
- Assurez-vous qu'elle commence par "B" (clé publique)

### Erreur "Permission denied"
- L'utilisateur a refusé les notifications
- Demandez-lui d'autoriser dans les paramètres du navigateur

### Notifications ne s'affichent pas
1. Vérifiez que le service worker est bien enregistré
2. Testez avec les outils de développement Firebase
3. Vérifiez les logs de la console

## Configuration avancée

### Service Worker personnalisé

Si vous utilisez un service worker personnalisé, ajoutez :

```javascript
// public/sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  // Votre config Firebase
})

const messaging = firebase.messaging()
```

### Test depuis la Console Firebase

1. Allez dans **Console Firebase** > **Cloud Messaging**
2. Cliquez sur **"Envoyer votre premier message"**
3. Remplissez le titre et le message
4. Sélectionnez votre application
5. Envoyez le message de test

## Sécurité

⚠️ **Important** :
- La clé VAPID publique peut être exposée côté client
- Ne jamais exposer la clé VAPID privée
- Utilisez des variables d'environnement pour la production

## Liens utiles

- [Documentation Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/js/client)
- [VAPID Protocol Specification](https://tools.ietf.org/html/rfc8292)
- [Firebase Console](https://console.firebase.google.com)