import { auth, db } from "../main_scripts/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const targetUser = urlParams.get('user');

const usernameDisplay = document.getElementById("profile-username");
const statsContainer = document.getElementById("stats-container");
const errorDisplay = document.getElementById("error-message");
const addFriendBtn = document.getElementById("add-friend-btn");

onAuthStateChanged(auth, 
    async (loggedInUser) =>
    {
        let usernameToSearch = targetUser;
        let currentLoggedInUsername = null;

        // Fetch the actual username of the person logged in
        if (loggedInUser)
        {
            const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
            if (userDoc.exists()) {
                currentLoggedInUsername = userDoc.data().username;
            }
        }

        // If no user is specified in the URL, default to the logged-in user
        if (!usernameToSearch)
        {
            if (currentLoggedInUsername) {
                usernameToSearch = currentLoggedInUsername;
            } else {
                usernameDisplay.textContent = "Not Logged In";
                errorDisplay.textContent = "Please log in to view your profile.";
                return;
            }
        }

        usernameDisplay.textContent = usernameToSearch;
        
        // Check if looking at someone else's profile to reveal the Add Friend button
        if (currentLoggedInUsername && currentLoggedInUsername !== usernameToSearch)
        {
            addFriendBtn.classList.remove("hidden");
        }

        await loadUserProfile(usernameToSearch);
    }
);

async function loadUserProfile(username)
{
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    
    try {
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty)
        {
            usernameDisplay.textContent = "User Not Found";
            addFriendBtn.classList.add("hidden");
            return;
        }

        querySnapshot.forEach(
            (doc) =>
            {
                const data = doc.data();
                document.getElementById("stat-kata-rush").textContent = data.kataRush || 0;
                document.getElementById("stat-hira-rush").textContent = data.hiraRush || 0;
            
              statsContainer.classList.remove("hidden");
            }
        );
    } catch (error) {
        errorDisplay.textContent = "Error loading profile data.";
        console.error(error);
    }
}

// Future feature stub
addFriendBtn.addEventListener("click",
    () =>
    {
        alert(`Friend request feature coming soon! You will be able to send a request to ${targetUser}.`);
    }
);