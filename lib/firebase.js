// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWntWuNdJAelE_cL3xHFSoPUVGfbAXlI0",
  authDomain: "meal-management-b8d93.firebaseapp.com",
  projectId: "meal-management-b8d93",
  storageBucket: "meal-management-b8d93.firebasestorage.app",
  messagingSenderId: "366719409028",
  appId: "1:366719409028:web:2eab50441a624d9be35bd1",
  measurementId: "G-7DF7BTMVMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);