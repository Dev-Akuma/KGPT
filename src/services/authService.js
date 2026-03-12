import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, setDoc } from 'firebase/firestore';
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

  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked by the browser. Allow popups for this site and try Google sign-in again.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication. Enable the Google provider in Firebase Console.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Current domain is not authorized. Add this domain in Firebase Authentication settings.';
  }

  if (code === 'auth/invalid-api-key') {
    return 'Firebase API key is invalid for this project. Verify VITE_FIREBASE_* values.';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with a different sign-in method for this email.';
  }

  if (code === 'auth/requires-recent-login') {
    return 'For security, please log in again before deleting your account.';
  }

  if (code) {
    return `${message || 'Authentication failed.'} (code: ${code})`;
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

async function deleteCollectionDocs(collectionRef) {
  const snapshot = await getDocs(query(collectionRef));
  if (snapshot.empty) {
    return;
  }

  await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)));
}

export async function deleteCurrentUserAccount() {
  const user = auth.currentUser;

  if (!user?.uid) {
    throw new Error('No authenticated user found.');
  }

  const userId = user.uid;
  const chatsCollectionRef = collection(db, 'users', userId, 'chats');
  const chatsSnapshot = await getDocs(query(chatsCollectionRef));

  for (const chatDoc of chatsSnapshot.docs) {
    const messagesCollectionRef = collection(db, 'users', userId, 'chats', chatDoc.id, 'messages');
    await deleteCollectionDocs(messagesCollectionRef);
    await deleteDoc(chatDoc.ref);
  }

  const profileCollectionRef = collection(db, 'users', userId, 'profile');
  await deleteCollectionDocs(profileCollectionRef);

  await deleteDoc(doc(db, 'users', userId));
  await deleteUser(user);
}
