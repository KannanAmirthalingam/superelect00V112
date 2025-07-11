// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
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

// Initialize Analytics (only in production)
let analytics;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Connect to emulators in development (optional)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Uncomment these lines if you want to use Firebase emulators in development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export { db, auth, analytics };
export default app;