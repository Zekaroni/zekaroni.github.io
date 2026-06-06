// accountHandler.js
import { auth } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export let currentUser = null;

onAuthStateChanged(auth, (user) =>
{
    currentUser = user;
    if (user)
    {
        console.log("Logged in:", user.email);
    } else {
        console.log("Not logged in");
    }
});

export function loginUser(email, password)
{
    return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser()
{
    return signOut(auth);
}