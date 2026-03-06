import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export function toAuthErrorMessage(error) {
  const message = error?.message || '';
  const code = error?.code || '';

  if (message.includes('CONFIGURATION_NOT_FOUND') || code === 'auth/configuration-not-found') {
    return 'Firebase Authentication configuration is missing. Check that VITE_FIREBASE_* values match the same Firebase project and enable Email/Password or Google providers in Firebase Console.';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid email or password.';
  }

  if (code === 'auth/user-not-found') {
    return 'No account found for this email.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Try signing in instead.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Current domain is not authorized. Add this domain in Firebase Authentication settings.';
  }

  return message || 'Authentication failed.';
}

async function ensureUserDocument(user) {
  if (!user?.uid) {
    return;
  }

  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email || '',
    },
    { merge: true },
  );
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await ensureUserDocument(user);
    }

    callback(user);
  });
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureUserDocument(credential.user);
  return credential.user;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(credential.user);
  return credential.user;
}

export async function registerWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(credential.user);
  return credential.user;
}

export function logout() {
  return signOut(auth);
}
