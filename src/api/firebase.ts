import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(config)
const auth = getAuth(app)

export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  const credential = GoogleAuthProvider.credentialFromResult(result)
  if (!credential?.idToken) throw new Error('Google did not return an ID token')
  return credential.idToken
}
