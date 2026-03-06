// Grabs the player name and score from the form inputs and sends a POST
// request to the API to add a new player to the scoreboard
const addPlayer = () => {
    const name = document.getElementById("playerName").value;
    const score = document.getElementById("playerScore").value;
    // Send the name and score as JSON in the request body
    fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, score: parseInt(score) })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

// Grabs the player index and new score from the form inputs and sends a PUT
// request to update that player's score in the array
const updatePlayer = () => {
    const index = document.getElementById("updateIndex").value;
    const score = document.getElementById("updateScore").value;
    // Index is passed as a query parameter, new score goes in the request body
    fetch(`/api?index=${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: parseInt(score) })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

// Grabs the player index from the input and sends a DELETE request
// to remove that player from the scoreboard array
const deletePlayer = () => {
    const index = document.getElementById("deleteIndex").value;
    // Index is passed as a query parameter
    fetch(`/api?index=${index}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}