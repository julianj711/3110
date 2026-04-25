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
        let isFirstMessage = true;
        let userInteracted = false;

        // Set flag when user clicks anything on the page
        document.addEventListener('click', () => { userInteracted = true;});
        
        // When server sends an update, re-render the scoreboard
        eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                renderScoreboard(data.players);
                
                if(isFirstMessage) {
                        isFirstMessage = false;
                        return;
                }

                if(Notification.permission === 'granted'){
                        const sorted = data.players.sort((a, b) => b.score - a.score);
                        const top3 = sorted.slice(0,3);
                        const body = top3.map((player, index) => `${index + 1}. ${player.name} - ${player.score}`).join('\n');
                        
                        if(userInteracted) {
                                navigator.vibrate(200);
                        }
                        new Notification("New Scoreboard Update", {body: body});

                }
                flag = true
        };

        // Handle connection errors
        eventSource.onerror = () => {
                console.log("SSE connection lost, retrying...");
        };
}
// Automatically load the scoreboard as soon as the page finishes loading
window.onload = loadScoreboard;

// Call fullscreen api and enter into full screen mode
const enterFullScreen = () => {

        // Grab the table from the page
        const table = document.getElementById("scoreboard");

        // Check if we're in fullscreen mode
        if (document.fullscreenElement) {
                document.exitFullscreen();
                return;
        }
        // Otherwise enter fullscreen mode
        table.requestFullscreen().catch((err) => {
                console.error(`Error enabling fullscreen: ${err.message}`);
        });

}

// Get user notification permission
async function requestNotificationPermission() {

        // Check if notifications are supported
        if (!('Notification' in window)) {
                alert("Notifications are not supported on this browser/device");
                return;
        }

        let result = await Notification.requestPermission();
        
        if (result === "granted") {
                const notification = new Notification("You will now receive Scoreboard Updates :)");
        }
        else{
                alert("You won't receive score updates :(");
        }
}