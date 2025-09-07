import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "nasnotes",
  appId: "1:460593075789:web:181be3c74e7833fd7f6e04",
  storageBucket: "nasnotes.firebasestorage.app",
  apiKey: "AIzaSyCkjvoDDJGTIkQKRdhyNExnhEyPcHDpQtE",
  authDomain: "nasnotes.firebaseapp.com",
  messagingSenderId: "460593075789",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };
