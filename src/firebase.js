import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Remplacer ces valeurs par celles de votre projet Firebase
// Voir les instructions dans le README pour obtenir ces valeurs
const firebaseConfig = {
  apiKey: "AIzaSyBfkr6N4fM1TBGuMNZuUsyiesGn8c3-ONk",
  authDomain: "metro-roulette.firebaseapp.com",
  projectId: "metro-roulette",
  storageBucket: "metro-roulette.firebasestorage.app",
  messagingSenderId: "1069264313204",
  appId: "1:1069264313204:web:0d1b81b3a78720ecf66a21",
  measurementId: "G-SKMZHD6C8B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
