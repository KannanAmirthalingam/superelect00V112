import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBPozT_yBqiRPyYFZ7UfoeTjdvl-hubsv8",
  authDomain: "eletronicstracker.firebaseapp.com",
  projectId: "eletronicstracker",
  storageBucket: "eletronicstracker.firebasestorage.app",
  messagingSenderId: "173220952674",
  appId: "1:173220952674:web:a458fab326a918ce92af3b",
  measurementId: "G-WJLD9N9YVY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);