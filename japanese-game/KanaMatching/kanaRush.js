import { auth, db } from "../main_scripts/firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { fetchAndRenderLeaderboard } from "../main_scripts/leaderboard.js";

// --- Game State ---
let currentUser             = null;       // Used to store current user in session
let currentMode             = "katakana"; // Defalut mode for Kana Rush
let kanaData                = [];
let unusedData              = [];
let singletonsMissingRomaji = [];
let singletonsMissingKana   = [];
let currentSelectedCells    = [];
let highScores = {
    katakana: 0,
    hiragana: 0
};

let score           = 0;
let timeLeft        = 300;
let totalTimePlayed = 0;
let timerInterval   = null;
let isPlaying       = false;

// --- DOM Elements ---
const modeSelect       = document.getElementById("mode-select");
const highScoreDisplay = document.getElementById("high-score-display");
const timeDisplay      = document.getElementById("time-display");
const scoreDisplay     = document.getElementById("score-display");
const mainUserDisplay  = document.getElementById("main-user-display");
const userStats        = document.getElementById("user-stats");
const guestWarning     = document.getElementById("guest-warning");
const gridCells        = document.querySelectorAll("td");
const countdownModal   = document.getElementById("countdown-modal")
const countdownText    = document.getElementById("countdown-text")

// --- Audio Effects ---
const hoverSound     = new Audio('../audio/hover.mp3');
const selectSound    = new Audio('../audio/select.mp3');
const countdownSound = new Audio('../audio/countdown.mp3');
const incorrectSound = new Audio('../audio/incorrect.mp3');
const correctSound   = new Audio('../audio/correct.mp3');
const startSound     = new Audio('../audio/start.mp3');

// --- Initialization ---
window.onload = async () =>
{
    if (modeSelect)
    {
        currentMode = modeSelect.value;
        modeSelect.addEventListener("change", handleModeChange);
    }

    kanaData = await fetchKanaData(currentMode);

    document.getElementById("start-btn").addEventListener("click", () =>
    {
        document.getElementById("start-modal").classList.add("hidden");
        startCountdown();
    });

    document.getElementById("restart-btn").addEventListener("click", () =>
    {
        document.getElementById("end-modal").classList.add("hidden");
        startCountdown();
    });

    gridCells.forEach(cell =>
    {
        cell.style.pointerEvents = "none";
        
        cell.addEventListener('click', () =>
        {
            if (isPlaying && !cell.classList.contains("matched")) playSound(selectSound);
            handleCellClick(cell);
        });

        cell.addEventListener('mouseenter', () =>
        {
            if (isPlaying && !cell.classList.contains("matched")) playSound(hoverSound);
        });
    });
};

// --- Authentication & User Data ---
onAuthStateChanged(auth,
    async (user) =>
    {
        if (user)
        {
            currentUser = user;
            userStats.classList.remove("hidden");
            guestWarning.classList.add("hidden");
            mainUserDisplay.textContent = user.email.split('@')[0];
            
            const docSnap = await getDoc(doc(db, "users", user.uid));
            
            if (docSnap.exists())
            {
                const data = docSnap.data();
                highScores.hiragana = data.hiraganaMatchingHighscore || 0;
                highScores.katakana = data.katakanaMatchingHighscore || 0;
                updateHighScoreDisplay();
            }
            
            fetchAndRenderLeaderboard(currentMode);
        } else {
            currentUser = null;
            highScores = { katakana: 0, hiragana: 0 };
            mainUserDisplay.textContent = "Guest Player";
            userStats.classList.add("hidden");
            guestWarning.classList.remove("hidden");
        }
    }
);

async function handleModeChange(e)
{
    currentMode = e.target.value;
    kanaData = await fetchKanaData(currentMode);
    
    if (currentUser)
    {
        updateHighScoreDisplay();
        fetchAndRenderLeaderboard(currentMode);
    }
}

function updateHighScoreDisplay()
{
    highScoreDisplay.textContent = highScores[currentMode];
}

// --- Game Loop ---
async function startCountdown()
{
    countdownModal.classList.remove("hidden");
    
    countdownText.textContent = "3";
    playSound(countdownSound);
    await sleep(1000);
    countdownText.textContent = "2";
    playSound(countdownSound);
    await sleep(1000);
    countdownText.textContent = "1";
    playSound(countdownSound);
    await sleep(1000);
    playSound(startSound);

    countdownModal.classList.add("hidden");
    startGame();
}

function startGame()
{
    if (timerInterval) clearInterval(timerInterval); 
    
    isPlaying = true;
    timeLeft = 300;
    totalTimePlayed = 0;
    score = 0;
    currentSelectedCells = [];
    
    updateTimerGUI();
    populateCells([...kanaData]);

    timerInterval = setInterval(
        () =>
        {
            if (!isPlaying)
            {
                clearInterval(timerInterval);
                return;
            }

            if (timeLeft <= 0)
            {
                endGame();
                return;
            }

            timeLeft--;
            totalTimePlayed++;
            updateTimerGUI();
        }, 100
    );
}

async function endGame()
{
    isPlaying = false;
    clearInterval(timerInterval);
    timerInterval = null;

    document.getElementById("final-score").textContent = score;
    document.getElementById("final-time").textContent = (totalTimePlayed / 10).toFixed(1);
    
    if (currentUser && score > highScores[currentMode])
    {
        highScores[currentMode] = score;

        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                email: currentUser.email,
                katakanaMatchingHighscore: highScores.katakana,
                hiraganaMatchingHighscore: highScores.hiragana
            },
            { merge: true }
        );
        
        updateHighScoreDisplay();
        fetchAndRenderLeaderboard(currentMode);
    }

    document.getElementById("end-modal").classList.remove("hidden");
    
    gridCells.forEach(
        cell =>
        {
            cell.style.pointerEvents = "none";
            cell.classList.remove("clicked-color"); 
        }
    );
}

// --- Grid Logic ---
function populateCells(data)
{
    unusedData = shuffleArray(data);
    singletonsMissingRomaji = [];
    singletonsMissingKana = [];
    let tiles = [];

    // 6 valid pairs (12 tiles)
    unusedData.splice(0, 6).forEach(
        item =>
        {
            tiles.push({ text: item.kana, matchId: item.id });
            tiles.push({ text: item.romaji, matchId: item.id });
        }
    );

    // 2 Kana distractors
    unusedData.splice(0, 2).forEach(
        item =>
        {
            tiles.push({ text: item.kana, matchId: item.id });
            singletonsMissingRomaji.push(item);
        }
    );

    // 2 Romaji distractors
    unusedData.splice(0, 2).forEach(
        item =>
        {
            tiles.push({ text: item.romaji, matchId: item.id });
            singletonsMissingKana.push(item);
        }
    );

    tiles = shuffleArray(tiles);

    for (let i = 0; i < 16; i++)
    {
        const cell = document.querySelector(`#cell${i + 1}`);
        cell.textContent = tiles[i].text;
        cell.dataset.matchId = tiles[i].matchId; 
        cell.classList.remove('clicked-color', 'flash-green', 'flash-red', 'matched');
        cell.style.pointerEvents = "auto";
    };
};

async function handleCellClick(cell)
{
    if (!isPlaying || timeLeft <= 0 || cell.classList.contains("matched")) return; 

    // Deselect if already clicked
    if (cell.classList.contains("clicked-color"))
    {
        cell.classList.remove("clicked-color");
        currentSelectedCells = currentSelectedCells.filter(c => c !== cell);
        return;
    }

    if (currentSelectedCells.length >= 2) return;

    cell.classList.add('clicked-color');
    currentSelectedCells.push(cell);

    if (currentSelectedCells.length === 2)
    {
        const [cell1, cell2] = currentSelectedCells;

        if (cell1.dataset.matchId === cell2.dataset.matchId)
        {
            cell1.classList.add("matched");
            cell2.classList.add("matched");
            
            // Add time. 
            // 30 deci-seconds for 1 score, 17 ds at 10 score, 9 ds at 20 score, 5 at 30 score and on
            let timeGain = Math.max(5,
                Math.round(
                    30 * Math.pow(0.943, score) // Score pre-increment
                )
            )

            score++;
            timeLeft += timeGain; 
            updateTimerGUI();

            await Promise.all([flashCell(cell1, 'green'), flashCell(cell2, 'green')]);
            playSound(correctSound);
            if (isPlaying) replaceMatchedCells(cell1, cell2);
            
        } else {
            timeLeft -= 10; 
            updateTimerGUI();
            
            flashCell(cell1, 'red');
            flashCell(cell2, 'red');
            playSound(incorrectSound);
            
            if (timeLeft <= 0) endGame(); 
        }
        
        currentSelectedCells = [];
    }
};

// --- Dynamic Tile Replacement (Anti-Cheese System) ---
function replaceMatchedCells(cell1, cell2) {
    if (!isPlaying) return;

    if (
        unusedData.length === 0 &&              //
        singletonsMissingRomaji.length === 0 && //
        singletonsMissingKana.length === 0      //
    ){  // 
        unusedData = shuffleArray([...kanaData]);
    }

    if (unusedData.length > 0)
    {
        // Randomly resolve an unmatched singleton to keep the board moving
        if (Math.random() > 0.5 && singletonsMissingRomaji.length > 0)
        {
            promoteSingleton(cell1, cell2, singletonsMissingRomaji, 'romaji', 'kana');
        } else if (singletonsMissingKana.length > 0)
        {
            promoteSingleton(cell1, cell2, singletonsMissingKana, 'kana', 'romaji');
        }
    } else if (singletonsMissingRomaji.length > 0 && singletonsMissingKana.length > 0)
    {
        // Tie up remaining singletons when data is exhausted
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

    cell1.classList.remove("matched", "clicked-color");
    cell2.classList.remove("matched", "clicked-color");
}

function promoteSingleton(targetCell1, targetCell2, singletonArray, type1, type2)
{
    const index = Math.floor(Math.random() * singletonArray.length);
    const itemToPromote = singletonArray.splice(index, 1)[0];
    
    targetCell1.textContent = itemToPromote[type1];
    targetCell1.dataset.matchId = itemToPromote.id;
    
    const newItem = unusedData.pop();
    targetCell2.textContent = newItem[type2];
    targetCell2.dataset.matchId = newItem.id;
    
    if (type2 === 'kana') singletonsMissingRomaji.push(newItem);
    else singletonsMissingKana.push(newItem);
}

// --- Utilities ---
function updateTimerGUI()
{
    timeDisplay.textContent = (Math.max(0, timeLeft) / 10).toFixed(1);
    scoreDisplay.textContent = score;
}

function shuffleArray(array)
{
    for (let i = array.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchKanaData(type)
{
    const response = await fetch(`../data/${type}.csv`);
    const csv = await response.text();
    return csv.trim().split('\n').slice(1).map(
        row =>
        {
            const [id, kana, romaji] = row.split(',');
            return { id, kana, romaji };
        }
    );
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function flashCell(cell, color)
{
    const className = `flash-${color}`;
    cell.classList.remove("clicked-color");
    cell.classList.add(className);
    await sleep(color === 'green' ? 100 : 200);
    cell.classList.remove(className);
}

async function playSound(audio)
{
    audio.currentTime = 0; // Keeps same sounds from overlapping
    audio.play().catch(
        error =>
        { // Catches any errors related to audio
            console.error("Audio Error:", error);
        }
    );
}