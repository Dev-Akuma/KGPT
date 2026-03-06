import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const userRef = (userId) => doc(db, 'users', userId);
const chatsRef = (userId) => collection(db, 'users', userId, 'chats');
const chatRef = (userId, chatId) => doc(db, 'users', userId, 'chats', chatId);
const messagesRef = (userId, chatId) =>
  collection(db, 'users', userId, 'chats', chatId, 'messages');

export async function ensureUserDoc(userId, email = '') {
  await setDoc(
    userRef(userId),
    {
      email,
    },
    { merge: true },
  );
}

export async function createChat(userId) {
  const newChatRef = doc(chatsRef(userId));

  await setDoc(newChatRef, {
    title: 'New Chat',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newChatRef.id;
}

export function subscribeToChats(userId, onData, onError) {
  const chatsQuery = query(chatsRef(userId), orderBy('updatedAt', 'desc'));

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats = snapshot.docs.map((chatDoc) => ({
        id: chatDoc.id,
        ...chatDoc.data(),
      }));
      onData(chats);
    },
    onError,
  );
}

export function subscribeToMessages(userId, chatId, onData, onError) {
  const messagesQuery = query(messagesRef(userId, chatId), orderBy('timestamp', 'asc'));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));
      onData(messages);
    },
    onError,
  );
}

export async function addMessage(userId, chatId, role, content) {
  await addDoc(messagesRef(userId, chatId), {
    role,
    content,
    timestamp: serverTimestamp(),
  });

  await updateDoc(chatRef(userId, chatId), {
    updatedAt: serverTimestamp(),
  });
}

export async function updateChatTitle(userId, chatId, title) {
  await updateDoc(chatRef(userId, chatId), {
    title,
    updatedAt: serverTimestamp(),
  });
}
