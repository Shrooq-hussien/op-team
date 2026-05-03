// Firebase Configuration
// Replace these values with your Firebase project config from:
// Firebase Console → Project Settings → General → Your apps → SDK setup

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

// ⚠️ REPLACE THESE WITH YOUR FIREBASE CONFIG ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyAmET1t7g4heF8tVJ63No7vBETI__vxxnc",
  authDomain: "ieee-opteam.firebaseapp.com",
  projectId: "ieee-opteam",
  storageBucket: "ieee-opteam.firebasestorage.app",
  messagingSenderId: "711335527656",
  appId: "1:711335527656:web:2bee01ae95d1e9424d755d",
  measurementId: "G-WB3XTSVPX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp };
