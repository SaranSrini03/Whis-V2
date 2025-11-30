import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, set, remove, push, onValue ,onDisconnect} from "firebase/database";
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

// Initialize Firebase only if it's not initialized already
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig); // Initialize Firebase if no apps are initialized
} else {
  app = getApp(); // Use the existing app instance
}

const database = getDatabase(app);
const auth = getAuth(app);

// Initialize Storage with explicit bucket URL if provided
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

// Export the Firebase app instance, auth, database methods, and storage
export { app as firebaseApp, database, ref, set, push, onValue, remove, auth, onDisconnect, storage };
