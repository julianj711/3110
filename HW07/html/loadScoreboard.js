// Fetches all players from the API and renders them into the scoreboard table
// sorted from highest to lowest score
const loadScoreboard = () => {

        // Render the scoreboard table
        const renderScoreboard = (players) => {
                const tbody = document.getElementById("scoreboardBody");
                tbody.innerHTML = "";

                // Sort players by score descending
                const sorted = players.sort((a, b) => b.score - a.score);

                sorted.forEach((player, index) => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                                <td>${index + 1}</td>
                                <td>${player.name}</td>
                                <td>${player.score}</td>
                                <td>${player.modified_by}</td>
                        `;
                        // Inject the row into the table body
                        tbody.appendChild(row);
                });
        };
        // Connect to SSE endpoint — server will push updates automatically
        const eventSource = new EventSource('/events');

        // When server sends an update, re-render the scoreboard
        eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                renderScoreboard(data.players);
        };
        // Handle connection errors
        eventSource.onerror = () => {
                console.log("SSE connection lost, retrying...");
        };
}
// Automatically load the scoreboard as soon as the page finishes loading
window.onload = loadScoreboard;