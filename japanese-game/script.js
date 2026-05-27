import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentHighScore = 0;

let fullKanaData = [];
let unusedData = [];
let singletonsMissingRomaji = [];
let singletonsMissingKana = [];
let currentSelectedCells = [];
let timeLeft = 300; 
let totalTimePlayed = 0; 
let score = 0;
let timerInterval = null;
let isPlaying = false; 

const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");
const authError = document.getElementById("auth-error");

function getFakeEmail(username) {
    const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
    return `${cleanUsername}@hiraganamatch.internal`;
}

function getUsernameFromEmail(email) {
    return email.split('@')[0];
}

document.getElementById("register-btn").addEventListener("click", () => {
    authError.textContent = ""; 

    if (!usernameInput.value) {
        authError.textContent = "Please enter a username.";
        return;
    }
    
    if (passwordInput.value.length < 6) {
        authError.textContent = "Password must be at least 6 characters long.";
        return;
    }

    const fakeEmail = getFakeEmail(usernameInput.value);
    
    createUserWithEmailAndPassword(auth, fakeEmail, passwordInput.value)
        .catch(error => {
            if (error.code === 'auth/email-already-in-use') {
                authError.textContent = "That username is already taken!";
            } else {
                authError.textContent = error.message;
            }
        });
});

document.getElementById("login-btn").addEventListener("click", () => {
    authError.textContent = ""; 
    
    if (!usernameInput.value) {
        authError.textContent = "Please enter a username.";
        return;
    }
    
    const fakeEmail = getFakeEmail(usernameInput.value);
    
    signInWithEmailAndPassword(auth, fakeEmail, passwordInput.value)
        .catch(error => authError.textContent = error.message);
});

document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("auth-section").classList.add("hidden");
        document.getElementById("user-info").classList.remove("hidden");
        document.getElementById("start-btn").classList.remove("hidden");
        
        document.getElementById("display-username").textContent = getUsernameFromEmail(user.email);
        
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            currentHighScore = docSnap.data().highScore || 0;
            document.getElementById("high-score-display").textContent = currentHighScore;
        }
    } else {
        currentUser = null;
        currentHighScore = 0;
        document.getElementById("auth-section").classList.remove("hidden");
        document.getElementById("user-info").classList.add("hidden");
        document.getElementById("start-btn").classList.add("hidden");
    }
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getHiragana() {
    const response = await fetch('./data/hiragana.csv');
    const csv = await response.text();
    const rows = csv.trim().split('\n').slice(1);
    
    return rows.map(row => {
        const [id, kana, romaji] = row.split(',');
        return { id, kana, romaji };
    });
}

window.onload = async function() {
    fullKanaData = await getHiragana();
    
    document.querySelectorAll('td').forEach(cell => {
        cell.style.pointerEvents = "none";
    });
};

document.getElementById("start-btn").addEventListener("click", () => {
    document.getElementById("start-modal").classList.add("hidden");
    startGame();
});

document.getElementById("restart-btn").addEventListener("click", () => {
    document.getElementById("end-modal").classList.add("hidden");
    startGame();
});

function startGame() {
    if (timerInterval) clearInterval(timerInterval); 
    
    isPlaying = true;
    timeLeft = 300;
    totalTimePlayed = 0;
    score = 0;
    currentSelectedCells = [];
    updateHUD();

    populateCells([...fullKanaData]);

    timerInterval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(timerInterval);
            return;
        }

        if (timeLeft <= 0) {
            endGame();
            return;
        }

        timeLeft--;
        totalTimePlayed++;
        updateHUD();
    }, 100);
}

function updateHUD() {
    document.getElementById("time-display").textContent = (Math.max(0, timeLeft) / 10).toFixed(1);
    document.getElementById("score-display").textContent = score;
}

async function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    timerInterval = null;

    document.getElementById("final-score").textContent = score;
    document.getElementById("final-time").textContent = (totalTimePlayed / 10).toFixed(1);
    
    if (currentUser && score > currentHighScore) {
        currentHighScore = score;
        await setDoc(doc(db, "users", currentUser.uid), {
            email: currentUser.email,
            highScore: score
        }, { merge: true });
        document.getElementById("high-score-display").textContent = currentHighScore; 
    }

    document.getElementById("end-modal").classList.remove("hidden");
    
    document.querySelectorAll('td').forEach(cell => {
        cell.style.pointerEvents = "none";
        cell.classList.remove("clicked-color"); 
    });
}

function populateCells(kanaData) {
    unusedData = shuffleArray(kanaData);
    singletonsMissingRomaji = [];
    singletonsMissingKana = [];
    let tiles = [];

    const initialPairs = unusedData.splice(0, 7);
    initialPairs.forEach(item => {
        tiles.push({ text: item.kana, matchId: item.id });
        tiles.push({ text: item.romaji, matchId: item.id });
    });

    const kanaOnly = unusedData.splice(0, 1);
    kanaOnly.forEach(item => {
        tiles.push({ text: item.kana, matchId: item.id });
        singletonsMissingRomaji.push(item);
    });

    const romajiOnly = unusedData.splice(0, 1);
    romajiOnly.forEach(item => {
        tiles.push({ text: item.romaji, matchId: item.id });
        singletonsMissingKana.push(item);
    });

    tiles = shuffleArray(tiles);

    for (let i = 0; i < 16; i++) {
        const cell = document.querySelector(`#cell${i + 1}`);
        cell.textContent = tiles[i].text;
        cell.dataset.matchId = tiles[i].matchId; 
        cell.classList.remove('clicked-color', 'flash-green', 'flash-red', 'matched');
        cell.style.pointerEvents = "auto";
    }
}

document.querySelectorAll('td').forEach(cell => {
    cell.addEventListener('click', async () => {
        if (!isPlaying || timeLeft <= 0) return; 

        if (cell.classList.contains("clicked-color")) {
            cell.classList.remove("clicked-color");
            currentSelectedCells = currentSelectedCells.filter(c => c !== cell);
            return;
        }

        if (currentSelectedCells.length >= 2 || cell.classList.contains("matched")) {
            return;
        }

        cell.classList.add('clicked-color');
        currentSelectedCells.push(cell);

        if (currentSelectedCells.length === 2) {
            const [cell1, cell2] = currentSelectedCells;

            if (cell1.dataset.matchId === cell2.dataset.matchId) {
                cell1.classList.add("matched");
                cell2.classList.add("matched");
                
                score++;
                timeLeft += 10; 
                updateHUD();

                await Promise.all([flashCellGreen(cell1), flashCellGreen(cell2)]);
                
                if (isPlaying) replaceMatchedCells(cell1, cell2);
            } else {
                timeLeft -= 10; 
                updateHUD();

                flashCellRed(cell1);
                flashCellRed(cell2);
                
                if (timeLeft <= 0) {
                    endGame(); 
                }
            }
            
            currentSelectedCells = [];
        }
    });
});

function replaceMatchedCells(cell1, cell2) {
    if (!isPlaying) return;

    if (unusedData.length === 0 && singletonsMissingRomaji.length === 0 && singletonsMissingKana.length === 0) {
        unusedData = shuffleArray([...fullKanaData]);
    }

    if (unusedData.length > 0) {
        if (Math.random() > 0.5 && singletonsMissingRomaji.length > 0) {
            const index = Math.floor(Math.random() * singletonsMissingRomaji.length);
            const itemToPromote = singletonsMissingRomaji.splice(index, 1)[0];
            
            cell1.textContent = itemToPromote.romaji;
            cell1.dataset.matchId = itemToPromote.id;
            
            const newItem = unusedData.pop();
            cell2.textContent = newItem.kana;
            cell2.dataset.matchId = newItem.id;
            singletonsMissingRomaji.push(newItem);
            
        } else if (singletonsMissingKana.length > 0) {
            const index = Math.floor(Math.random() * singletonsMissingKana.length);
            const itemToPromote = singletonsMissingKana.splice(index, 1)[0];
            
            cell1.textContent = itemToPromote.kana;
            cell1.dataset.matchId = itemToPromote.id;
            
            const newItem = unusedData.pop();
            cell2.textContent = newItem.romaji;
            cell2.dataset.matchId = newItem.id;
            singletonsMissingKana.push(newItem);
        }
    } else {
        if (singletonsMissingRomaji.length > 0 && singletonsMissingKana.length > 0) {
            const item1 = singletonsMissingRomaji.pop();
            const item2 = singletonsMissingKana.pop();
            
            cell1.textContent = item1.romaji; 
            cell1.dataset.matchId = item1.id;
            
            cell2.textContent = item2.kana;   
            cell2.dataset.matchId = item2.id;
        } else {
            cell1.textContent = "";
            cell2.textContent = "";
            cell1.style.pointerEvents = "none";
            cell2.style.pointerEvents = "none";
        }
    }

    cell1.classList.remove("matched", "clicked-color");
    cell2.classList.remove("matched", "clicked-color");
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function flashCellRed(cell) {
    cell.classList.remove("clicked-color");
    cell.classList.add('flash-red');
    await sleep(200);
    cell.classList.remove('flash-red');
}

async function flashCellGreen(cell) {
    cell.classList.remove("clicked-color");
    cell.classList.add('flash-green');
    await sleep(100);
    cell.classList.remove('flash-green');
}