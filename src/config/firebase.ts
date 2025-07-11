// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPozT_yBqiRPyYFZ7UfoeTjdvl-hubsv8",
  authDomain: "eletronicstracker.firebaseapp.com",
  projectId: "eletronicstracker",
  storageBucket: "eletronicstracker.firebasestorage.app",
  messagingSenderId: "173220952674",
  appId: "1:173220952674:web:a458fab326a918ce92af3b",
  measurementId: "G-WJLD9N9YVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, analytics };
export default app;