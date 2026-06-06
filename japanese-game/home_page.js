import { auth } from "./main_scripts/firebase-init.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


// TODO: Have the user sign up with an email and pick a username when registering. Make sure a check is added so there are no duplicate names
const getPseudoEmail = (username) => `${username.trim().replace(/\s+/g, '').toLowerCase()}@hiraganamatch.internal`;

onAuthStateChanged(auth,
    (user) =>
    {
        if (user)
        {
            document.getElementById('user-status').textContent = "Logged in as: " + user.email.split('@')[0];
            document.getElementById('btn-profile').classList.remove('disabled-btn');
            document.getElementById('btn-profile').onclick = () => window.location.href = 'profile.html';
            
            document.getElementById('btn-login-ui').classList.add('hidden');
            document.getElementById('btn-logout-ui').classList.remove('hidden');
            document.getElementById('auth-modal').classList.add('hidden');
        } else {
            document.getElementById('user-status').textContent = "Not logged in";
            document.getElementById('btn-profile').classList.add('disabled-btn');
            document.getElementById('btn-profile').onclick = null;
            
            document.getElementById('btn-login-ui').classList.remove('hidden');
            document.getElementById('btn-logout-ui').classList.add('hidden');
        }
    }
);

// UI Listeners
document.getElementById('btn-login-ui').onclick = () =>
{
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('auth-error').textContent = "";
};

document.getElementById('close-modal').onclick = () => document.getElementById('auth-modal').classList.add('hidden');
document.getElementById('btn-logout-ui').onclick = () => signOut(auth);

document.getElementById('register-submit').onclick = () =>
{
    const user = document.getElementById('username-input').value;
    const pass = document.getElementById('password-input').value;
    if (!user || pass.length < 6) return document.getElementById('auth-error').textContent = "Invalid username or short password.";
    createUserWithEmailAndPassword(auth, getPseudoEmail(user), pass).catch(e => document.getElementById('auth-error').textContent = e.message);
};

document.getElementById('login-submit').onclick = () =>
{
    const user = document.getElementById('username-input').value;
    const pass = document.getElementById('password-input').value;
    if (!user) return document.getElementById('auth-error').textContent = "Please enter a username.";
    signInWithEmailAndPassword(auth, getPseudoEmail(user), pass).catch(e => document.getElementById('auth-error').textContent = e.message);
};