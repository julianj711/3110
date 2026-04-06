// Fetches all players from the API and renders them into the scoreboard table
// sorted from highest to lowest score
const loadScoreboard = () => {
    fetch('/api')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("scoreboardBody");
            // clear existing rows
            tbody.innerHTML = "";

            // Sort players by score descending
            const sorted = data.players.sort((a, b) => b.score - a.score);

            // Loop through each player and build a table row dynamically
            sorted.forEach((player, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${player.name}</td>
                    <td>${player.score}</td>
                `;
                // Inject the row into the table body
                tbody.appendChild(row);
            });
        });
}
// Automatically load the scoreboard as soon as the page finishes loading
window.onload = loadScoreboard;
