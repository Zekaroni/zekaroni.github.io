import { db } from "./firebase-init.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function fetchAndRenderLeaderboard(mode)
{
    const scoreField = mode === "katakana" ? "kataRush" : "hiraRush";
    const q = query(collection(db, "users"), orderBy(scoreField, "desc"), limit(10));
    
    try {
        const queryResult = await getDocs(q);
        const players = [];
        
        queryResult.forEach(
            (doc) =>
            {
                const data = doc.data();
                // Strictly fetch the new username field
                const playerName = data.username || "Unknown"; 
                
                if (data && data[scoreField] > 0) {
                    players.push({ 
                        name: playerName, 
                        score: data[scoreField] 
                    });
                }
            }
        );
        
        renderLeaderboard(players);
    } catch (error) {
        console.error("Error loading leaderboard:", error);
    }
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
            listItem.innerHTML = `<strong><a href="../Profile/?user=${player.name}" class="player-link"">${player.name}</a></strong> - ${player.score} pts`;
        } else {
            listItem.innerHTML = `<span style="color: #bbb;">--- Empty Slot ---</span>`;
        }

        leaderboardList.appendChild(listItem);
    }
}