// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// REPLACE THESE VALUES WITH YOUR OWN FROM THE FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyD85wBSFmtG2FtHMPwnG4VwvCk_W8W3aOs",
    authDomain: "rkm-ledger.firebaseapp.com",
    projectId: "rkm-ledger",
    storageBucket: "rkm-ledger.firebasestorage.app",
    messagingSenderId: "482234259600",
    appId: "1:482234259600:web:97e9fb618dda7120822015",
    measurementId: "G-EKHPTFPN93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
