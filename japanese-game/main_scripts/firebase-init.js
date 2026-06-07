// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { // Added new Firebase "Dojolingo" api
    apiKey: "AIzaSyBms9pPlQaE3T7Wt_Nkk9OFfhh4u5cg2HU",
    authDomain: "dojolingo.firebaseapp.com",
    projectId: "dojolingo",
    storageBucket: "dojolingo.firebasestorage.app",
    messagingSenderId: "854883073754",
    appId: "1:854883073754:web:a64f4350df30aa46c8efe3",
    measurementId: "G-W88T0C2G4P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);