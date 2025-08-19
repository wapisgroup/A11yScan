// src/utils/firebase.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'

// TODO: replace these with your Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyD8SboIH9i5KFvEYHxZr_VUeaTuu4ndfRw",
  authDomain: "accessibilitychecker-c6585.firebaseapp.com",
  projectId: "accessibilitychecker-c6585",
  storageBucket: "accessibilitychecker-c6585.firebasestorage.app",
  messagingSenderId: "1007627748299",
  appId: "1:1007627748299:web:0f4d5b01850b8cdcc0ec4e",
  measurementId: "G-CCC28J2YFN"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const functions = getFunctions(app)
const provider = new GoogleAuthProvider()

const FirebaseContext = createContext()

export function FirebaseProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(u){
        // load extra profile from Firestore
        try{
          const ref = doc(db, 'users', u.uid)
          const snap = await getDoc(ref)
          const profile = snap.exists() ? snap.data() : {}
          setUser({ uid: u.uid, email: u.email, ...profile })
        }catch(err){
          console.error('Failed loading user profile', err)
          setUser({ uid: u.uid, email: u.email })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const loginWithGoogle = () => signInWithPopup(auth, provider)
  const register = async ({ email, password, firstName, lastName, company, phone }) => {
    const res = await createUserWithEmailAndPassword(auth, email, password)
    const uid = res.user.uid
    await setDoc(doc(db, 'users', uid), { firstName, lastName, company, phone, email, createdAt: serverTimestamp() })
    return res
  }
  const logout = () => signOut(auth)
  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  // change password requires reauth
  const changePassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser
    if(!user) throw new Error('Not authenticated')
    const cred = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, cred)
    await updatePassword(user, newPassword)
  }

  // create project and return its id
  const createProject = async ({ name, domain }) => {
    const docRef = await addDoc(collection(db, 'projects'), { name, domain, owner: auth.currentUser.uid, createdAt: serverTimestamp() })
    return docRef.id
  }

  // startScan (context wrapper) - creates run doc and calls cloud function if present
  const startScanCtx = async ({ projectId, domain, maxPages = 200 }) => {
    const runRef = await addDoc(collection(db, 'runs'), {
      projectId, domain, status: 'queued', createdBy: auth.currentUser.uid, createdAt: serverTimestamp(), maxPages
    })
    const runId = runRef.id
    try {
      const startFn = httpsCallable(functions, 'startScan')
      await startFn({ projectId, runId, domain, maxPages })
    } catch (e) {
      console.warn('startScan callable failed (no function configured?)', e && e.message ? e.message : e)
    }
    return runId
  }

  // helper to convert gs:// path to public download URL
  const getReportDownloadUrlCtx = async (gsUrl) => {
    if(!gsUrl) return null
    if(gsUrl.startsWith('gs://')) {
      const path = gsUrl.replace('gs://', '')
      const slash = path.indexOf('/')
      if(slash === -1) return null
      const filePath = path.substring(slash+1)
      const ref = storageRef(storage, filePath)
      return await getDownloadURL(ref)
    }
    return gsUrl
  }

  return <FirebaseContext.Provider value={{
    user, loading,
    login, loginWithGoogle, register, logout, resetPassword, changePassword,
    createProject, startScan: startScanCtx, getReportDownloadUrl: getReportDownloadUrlCtx,
    auth, db, storage
  }}>{children}</FirebaseContext.Provider>
}

// Named exports (so components can import them directly)
export async function startScan({ projectId, domain, maxPages = 200 }){
  // create a run document and call the cloud function if available
  const runRef = await addDoc(collection(db, 'runs'), {
    projectId, domain, status: 'queued', createdBy: auth.currentUser?.uid || null, createdAt: serverTimestamp(), maxPages
  })
  const runId = runRef.id
  try {
    const startFn = httpsCallable(functions, 'startScan')
    await startFn({ projectId, runId, domain, maxPages })
  } catch (e) {
    console.warn('startScan callable failed (no function configured?)', e && e.message ? e.message : e)
  }
  return runId
}

export async function getReportDownloadUrl(gsUrl){
  if(!gsUrl) return null
  if(gsUrl.startsWith('gs://')) {
    const path = gsUrl.replace('gs://', '')
    const slash = path.indexOf('/')
    if(slash === -1) return null
    const filePath = path.substring(slash+1)
    const ref = storageRef(storage, filePath)
    return await getDownloadURL(ref)
  }
  return gsUrl
}

export const useAuth = () => useContext(FirebaseContext)
export { auth, db, storage }