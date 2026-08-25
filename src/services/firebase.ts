import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration using Expo-friendly environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

if (!firebaseConfig.apiKey) {
  console.error("CRITICAL ERROR: Firebase API Key is missing or undefined!");
}

// Initialize Firebase App defensively
let app: any = null;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Error initializing Firebase App:", error);
}

// Configurar Auth con persistencia en AsyncStorage
let auth: Auth | any = null;
try {
  if (app) {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      auth = getAuth(app);
    }
  }
} catch (error) {
  console.error("Error initializing Firebase Auth:", error);
}

const db: Firestore | any = app ? getFirestore(app) : null;
const storage: FirebaseStorage | any = app ? getStorage(app) : null;

export { app, auth, db, storage };
export default app;




