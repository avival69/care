// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE,
  authDomain: "karegame-fd4d0.firebaseapp.com",
  projectId: "karegame-fd4d0",
  storageBucket: "karegame-fd4d0.firebasestorage.app",
  messagingSenderId: "929812552068",
  appId: "1:929812552068:web:f08671f2c7eac20a2fa5d1",
  measurementId: "G-7T911DK4RQ"
};

const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
