// accountHandler.js
import { auth } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export let currentUser = null;

// Track state
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        console.log("Logged in:", user.email);
        // Handle UI updates for logged-in user
    } else {
        console.log("Not logged in");
        // Handle UI updates for guest
    }
});

// Export functions so your HTML buttons can trigger them
export function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
    return signOut(auth);
}