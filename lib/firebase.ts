import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBA_u5h_tZh6_gxgoA4Ar1Wr6wmiWOhpiQ",
  authDomain: "clns-backend.firebaseapp.com",
  projectId: "clns-backend",
  storageBucket: "clns-backend.firebasestorage.app",
  messagingSenderId: "1093693694119",
  appId: "1:1093693694119:web:a3d6733bccbce0f9c17b82"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };
