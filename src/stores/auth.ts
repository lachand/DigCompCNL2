import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User as FirebaseUser
} from 'firebase/auth'
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  Unsubscribe
} from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { User, ExternalMember } from '@/types'
import { getUserColor } from '@/utils/helpers'
import { createDelayedListener, getOptimizedDelay, logOptimization } from '@/composables/useOptimizedDelays'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<FirebaseUser | null>(null)
  const userData = ref<User | null>(null)
  const users = ref<User[]>([])
  const externalMembers = ref<ExternalMember[]>([])
  const loading = ref(true)
  const error = ref('')

  let heartbeatInterval: number | null = null
  let usersUnsubscribe: Unsubscribe | null = null
  let externalMembersUnsubscribe: Unsubscribe | null = null

  const userColor = computed(() => {
    return userData.value?.email ? getUserColor(userData.value.email) : '#3b82f6'
  })

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = ''
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      error.value = err.message || 'Erreur de connexion'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }

      if (currentUser.value) {
        await updateDoc(doc(db, 'users', currentUser.value.uid), {
          state: 'idle'
        })
      }

      await firebaseSignOut(auth)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const updateUserPresence = async () => {
    if (!currentUser.value) return

    const userRef = doc(db, 'users', currentUser.value.uid)
    await updateDoc(userRef, {
      lastSeen: Date.now(),
      state: 'online'
    })
  }

  const startHeartbeat = () => {
    if (heartbeatInterval) return

    heartbeatInterval = window.setInterval(() => {
      updateUserPresence()
    }, 60000) // Every minute
  }

  const updateUserField = async (field: string, value: any) => {
    if (!currentUser.value) return

    const userRef = doc(db, 'users', currentUser.value.uid)
    await updateDoc(userRef, { [field]: value })
  }

  const togglePin = async (outcomeId: string) => {
    if (!userData.value) return

    const pinned = userData.value.pinned || []
    const index = pinned.indexOf(outcomeId)

    let newPinned: string[]
    if (index > -1) {
      newPinned = pinned.filter(id => id !== outcomeId)
    } else {
      newPinned = [...pinned, outcomeId]
    }

    await updateUserField('pinned', newPinned)
  }

  const isPinned = (outcomeId: string): boolean => {
    return userData.value?.pinned?.includes(outcomeId) || false
  }

  const addExternalMember = async (firstName: string, lastName: string): Promise<string> => {
    if (!currentUser.value?.email) throw new Error('Non connecté')

    const docRef = await addDoc(collection(db, 'external_members'), {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      createdBy: currentUser.value.email,
      createdAt: Date.now()
    })
    return docRef.id
  }

  const removeExternalMember = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'external_members', id))
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser.value || !currentUser.value.email) {
      throw new Error('Aucun utilisateur connecté')
    }

    const credential = EmailAuthProvider.credential(
      currentUser.value.email,
      currentPassword
    )

    try {
      await reauthenticateWithCredential(currentUser.value, credential)
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Le mot de passe actuel est incorrect')
      }
      throw new Error('Erreur de réauthentification : ' + (err.message || 'Erreur inconnue'))
    }

    try {
      await updatePassword(currentUser.value, newPassword)
    } catch (err: any) {
      if (err.code === 'auth/weak-password') {
        throw new Error('Le nouveau mot de passe est trop faible (minimum 6 caractères)')
      }
      throw new Error('Erreur lors du changement : ' + (err.message || 'Erreur inconnue'))
    }
  }

  const initAuth = () => {
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user
      loading.value = false

      if (user) {
        // Create/update user document
        const userRef = doc(db, 'users', user.uid)
        await setDoc(
          userRef,
          {
            uid: user.uid,
            email: user.email,
            lastSeen: Date.now(),
            state: 'online'
          },
          { merge: true }
        )

        // Listen to user data avec délai optimisé (60s)
        const userDataDelay = getOptimizedDelay('USER_DATA') // 60s
        logOptimization('Current User Data', userDataDelay)
        
        const fetchUserData = async () => {
          try {
            const snapshot = await getDoc(userRef)
            if (snapshot.exists()) {
              userData.value = snapshot.data() as User
            }
          } catch (err) {
            console.error('Error fetching user data:', err)
          }
        }
        
        // Premier chargement immédiat
        fetchUserData()
        
        // Ensuite polling toutes les 60 secondes
        const userDataCleanup = createDelayedListener(fetchUserData, userDataDelay, false)

        // Start heartbeat
        startHeartbeat()
        updateUserPresence()

        // Listen to all users avec délai IMPORTANT - passage en polling
        const delay = getOptimizedDelay('USER_LIST')
        logOptimization('Users List', delay)
        
        // Remplacer onSnapshot par polling pour économiser les lectures
        const fetchUsers = async () => {
          try {
            const snapshot = await getDocs(collection(db, 'users'))
            users.value = snapshot.docs.map(doc => doc.data() as User)
          } catch (err) {
            console.error('Error fetching users:', err)
          }
        }
        
        // Premier chargement
        fetchUsers()
        
        // Ensuite polling avec délai optimisé
        const usersCleanup = createDelayedListener(fetchUsers, delay, false)
        usersUnsubscribe = usersCleanup

        // Listen to external members avec polling optimisé (30min)
        const externalDelay = getOptimizedDelay('EXTERNAL_MEMBERS') // 30min
        logOptimization('External Members', externalDelay)
        
        const fetchExternalMembers = async () => {
          try {
            const snapshot = await getDocs(collection(db, 'external_members'))
            externalMembers.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExternalMember))
          } catch (err) {
            console.error('Error fetching external members:', err)
          }
        }
        
        // Premier chargement immédiat
        fetchExternalMembers()
        
        // Ensuite polling avec délai optimisé
        const externalCleanup = createDelayedListener(fetchExternalMembers, externalDelay, false)
        externalMembersUnsubscribe = externalCleanup
      } else {
        userData.value = null
        users.value = []
        externalMembers.value = []

        if (usersUnsubscribe) {
          usersUnsubscribe()
          usersUnsubscribe = null
        }
        if (externalMembersUnsubscribe) {
          externalMembersUnsubscribe()
          externalMembersUnsubscribe = null
        }
      }
    })
  }

  return {
    currentUser,
    userData,
    users,
    loading,
    error,
    userColor,
    login,
    logout,
    updateUserField,
    togglePin,
    isPinned,
    changePassword,
    externalMembers,
    addExternalMember,
    removeExternalMember,
    initAuth
  }
})
