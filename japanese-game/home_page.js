import { auth, db } from "./main_scripts/firebase-init.js";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth,
    async (user) =>
    {
        if (user)
        {
            // Block access if they somehow bypassed the login check
            if (!user.emailVerified)
            {
                document.getElementById('user-status').textContent = "Pending Email Verification...";
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let displayUsername = "User";
                if (userDoc.exists())
                {
                    displayUsername = userDoc.data().username;
                }

                document.getElementById('user-status').textContent = "Logged in as: " + displayUsername;
                document.getElementById('btn-profile').classList.remove('disabled-btn');
                document.getElementById('btn-profile').onclick = () => window.location.href = './Profile/';
                
                document.getElementById('btn-login-ui').classList.add('hidden');
                document.getElementById('btn-logout-ui').classList.remove('hidden');
                document.getElementById('auth-modal').classList.add('hidden');
            } catch (error) {
                console.error("Error fetching user document:", error);
                document.getElementById('user-status').textContent = "Error loading profile.";
            }
            
        } else {
            document.getElementById('user-status').textContent = "Not logged in";
            document.getElementById('btn-profile').classList.add('disabled-btn');
            document.getElementById('btn-profile').onclick = null;
            
            document.getElementById('btn-login-ui').classList.remove('hidden');
            document.getElementById('btn-logout-ui').classList.add('hidden');
        }
    }
);


// --- UI Listeners & Toggle Logic ---

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const usernameInput = document.getElementById('username-input');
const loginSubmit = document.getElementById('login-submit');
const registerSubmit = document.getElementById('register-submit');
const authError = document.getElementById('auth-error');

function setAuthMode(isLogin)
{
    authError.textContent = "";
    if (isLogin)
    {
        tabLogin.classList.add('active-tab');
        tabRegister.classList.remove('active-tab');
        usernameInput.classList.add('hidden');
        loginSubmit.classList.remove('hidden');
        registerSubmit.classList.add('hidden');
        document.getElementById('email-input').placeholder = "Email or Username";
    } else {
        tabRegister.classList.add('active-tab');
        tabLogin.classList.remove('active-tab');
        usernameInput.classList.remove('hidden');
        registerSubmit.classList.remove('hidden');
        loginSubmit.classList.add('hidden');
        document.getElementById('email-input').placeholder = "Email Address";
    }
}

tabLogin.onclick = () => setAuthMode(true);
tabRegister.onclick = () => setAuthMode(false);

document.getElementById('btn-login-ui').onclick = () =>
{
    document.getElementById('auth-modal').classList.remove('hidden');
    setAuthMode(true); // Always default to Login mode when opening
};

document.getElementById('close-modal').onclick = () => document.getElementById('auth-modal').classList.add('hidden');
document.getElementById('btn-logout-ui').onclick = () => signOut(auth);

document.getElementById('register-submit').onclick = async () =>
{
    const email = document.getElementById('email-input').value.trim();
    const user = document.getElementById('username-input').value.trim();
    const pass = document.getElementById('password-input').value;
    
    if (!email || !user || pass.length < 6) return authError.textContent = "Fill all fields. Password must be 6+ chars.";
    
    try {
        const q = query(collection(db, "users"), where("username", "==", user));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty)
        {
            authError.style.color = "red";
            return authError.textContent = "Username is already taken.";
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        
        // Send verification email
        await sendEmailVerification(userCredential.user);
        
        // Initialize profile
        await setDoc(doc(db, "users", userCredential.user.uid),
        {
            email: email,
            username: user,
            kataRush: 0,
            hiraRush: 0,
            friends: [],
            incomingRequests: [],
            outgoingRequests: []
        });

        // Sign out immediately so they have to properly log in once verified
        await signOut(auth);
        
        authError.style.color = "green";
        authError.textContent = "Account created! Check your email (and spam) to verify, then log in.";
        
    } catch (e) {
        console.error(e);
        authError.style.color = "red";
        authError.textContent = e.message;
    }
};

document.getElementById('login-submit').onclick = async () =>
{
    const loginInput = document.getElementById('email-input').value.trim();
    const pass = document.getElementById('password-input').value;
    
    if (!loginInput) return authError.textContent = "Please enter an email or username.";
    
    try {
        let loginEmail = loginInput;
        
        if (!loginInput.includes('@'))
        {
            const q = query(collection(db, "users"), where("username", "==", loginInput));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty)
            {
                authError.style.color = "red";
                return authError.textContent = "Username not found.";
            }
            
            loginEmail = querySnapshot.docs[0].data().email;
        }
        
        // Sign in the user
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, pass);
        
        // Force Firebase to fetch the newest data (like email verification status)
        await userCredential.user.reload();
        
        // Check if they actually clicked the link in their email
        if (!auth.currentUser.emailVerified)
        {
            authError.style.color = "red";
            authError.textContent = "Please verify your email before logging in.";
            await signOut(auth); // Keep them signed out until they verify
            return;
        }
        
        // Success! Hide the modal and clear errors
        document.getElementById('auth-modal').classList.add('hidden');
        authError.textContent = "";
        
    } catch (e) {
        console.error(e);
        authError.style.color = "red";
        authError.textContent = "Login failed: " + e.message;
    }
};