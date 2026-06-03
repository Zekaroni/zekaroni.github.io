// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCofQ5lysFcYHmZyMVyiJtnul0g0mGBZ6Q",
    authDomain: "japanese-game-ba74a.firebaseapp.com",
    projectId: "japanese-game-ba74a",
    storageBucket: "japanese-game-ba74a.firebasestorage.app",
    messagingSenderId: "421986374043",
    appId: "1:421986374043:web:8a76554eb70489e038513e",
    measurementId: "G-0NTJXMZCVN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);