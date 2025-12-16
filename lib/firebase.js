// Firebase bootstrap used across the app for database, auth, and storage.
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, set, remove, push, onValue, onDisconnect } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const database = getDatabase(app);
const auth = getAuth(app);

let storage;
try {
  if (firebaseConfig.storageBucket) {
    storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
  } else {
    storage = getStorage(app);
  }
} catch (error) {
  console.error("Error initializing Firebase Storage:", error);
  storage = getStorage(app);
}

export { app as firebaseApp, database, ref, set, push, onValue, remove, auth, onDisconnect, storage };
