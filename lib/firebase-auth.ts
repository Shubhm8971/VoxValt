// Firebase Authentication - Simple & Reliable
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore'

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export async function signUpWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Send email verification
    await sendEmailVerification(user)
    
    // Store user in Firestore
    await setDoc(doc(getFirestore(app), 'users', user.uid), {
      email: user.email,
      createdAt: new Date().toISOString(),
      plan: 'free' // Default plan
    })
    
    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function isEmailVerified(user: any) {
  await user.reload()
  return user.emailVerified
}

// Helper to get Firestore instance
function getFirestoreInstance() {
  return getFirestore(app)
}

export { auth }
