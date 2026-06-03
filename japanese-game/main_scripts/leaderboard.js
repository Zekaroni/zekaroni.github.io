// leaderboard.js
import { db } from './firebase-init.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function fetchLeaderboard(mode) {
    const scoreField = mode === "katakana" ? "katakanaMatchingHighscore" : "hiriganaMatchingHighscore";
    const q = query(collection(db, "users"), orderBy(scoreField, "desc"), limit(10));
    
    const queryResult = await getDocs(q);
    const players = [];
    
    queryResult.forEach((doc) => {
        players.push({ 
            name: doc.data().email.split('@')[0], 
            score: doc.data()[scoreField] || 0 
        });
    });
    
    return players; // Return the data so the game can render it
}