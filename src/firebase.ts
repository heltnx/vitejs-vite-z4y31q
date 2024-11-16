import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDorku0eblJj4IuueQpASdZC0J4lldIL1o",
  authDomain: "listes-9c9c8.firebaseapp.com",
  databaseURL: "https://listes-9c9c8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "listes-9c9c8",
  storageBucket: "listes-9c9c8.firebasestorage.app",
  messagingSenderId: "516778762400",
  appId: "1:516778762400:web:0dda0e90a07c2b6b9d29c5"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);