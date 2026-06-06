import { db } from './firebase-init.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function fetchAndRenderLeaderboard(mode)
{
    const scoreField = mode === "katakana" ? "katakanaMatchingHighscore" : "hiraganaMatchingHighscore";
    const q = query(collection(db, "users"), orderBy(scoreField, "desc"), limit(10));
    
    const queryResult = await getDocs(q);
    const players = [];
    
    queryResult.forEach((doc) =>
    {
        const data = doc.data();
        if (data && data.email)
        {
            players.push({ 
                name: data.email.split('@')[0], 
                score: data[scoreField] || 0 
            });
        }
    });
    
    renderLeaderboard(players);
}

function renderLeaderboard(playerData)
{
    const leaderboardList = document.getElementById("leaderboard-list");
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = ""; 

    const sortedPlayers = [...playerData].sort((a, b) => b.score - a.score);

    for (let i = 0; i < 10; i++)
    {
        const listItem = document.createElement("li");

        if (i < sortedPlayers.length)
        {
            const player = sortedPlayers[i];
            listItem.innerHTML = `<strong>${player.name}</strong> - ${player.score} pts`;
        } else {
            listItem.innerHTML = `<span style="color: #bbb;">--- Empty Slot ---</span>`;
        }

        leaderboardList.appendChild(listItem);
    }
}