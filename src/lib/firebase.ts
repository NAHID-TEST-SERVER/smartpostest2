import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Note: Automatic Firebase provisioning failed due to an infrastructure issue.
// You'll need to provide your own Firebase web configuration here or in environment variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCkvuJPoMOz-GPyOA4xVGQdl0lExM1tiCk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "start-with-nahid.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "start-with-nahid",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "start-with-nahid.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "181713544099",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:181713544099:web:2841b71da23a52b4aff016"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyCkvuJPoMOz-GPyOA4xVGQdl0lExM1tiCk";
