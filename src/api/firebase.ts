import { Capacitor } from '@capacitor/core'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export async function signInWithGoogle(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithGoogle()
    const idToken = result.credential?.idToken
    if (!idToken) throw new Error('Google did not return an ID token')
    return idToken
  }

  const [{ getApp, getApps, initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup }] =
    await Promise.all([import('firebase/app'), import('firebase/auth')])
  const auth = getAuth(getApps().length ? getApp() : initializeApp(config))
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  const credential = GoogleAuthProvider.credentialFromResult(result)
  if (!credential?.idToken) throw new Error('Google did not return an ID token')
  return credential.idToken
}
