// Redirect to login if no token found
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}
// Redirect admins away — this page is for authors only
if (localStorage.getItem('role') === 'admin') {
    window.location.href = 'scoreboard.html';
}
// Grabs the player name and score from the form inputs and sends a POST
// request to the API to add a new player to the scoreboard
const addPlayer = () => {
    const name = document.getElementById("playerName").value;
    const score = document.getElementById("playerScore").value;
	const token = localStorage.getItem('token');
    // Send the name and score as JSON in the request body
    fetch('/api', {
        method: 'POST',
		headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: name, score: parseInt(score) })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

// Grabs the player index and new score from the form inputs and sends a PUT
// request to update that player's score in the array
// By name(user ID) instead of index
const updatePlayer = () => {
	const name = document.getElementById("updateName").value;
    const score = document.getElementById("updateScore").value;
    const token = localStorage.getItem('token'); 
	// Index is passed as a query parameter, new score goes in the request body
    fetch(`/api/${name}`, {
        method: 'PUT',
		headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: parseInt(score) })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

// Grabs the player index from the input and sends a DELETE request
// to remove that player from the scoreboard array
// By name(user Id) indead of index
const deletePlayer = () => {
	const name = document.getElementById("deleteName").value;
    const token = localStorage.getItem('token')
	// Index is passed as a query parameter
    fetch(`/api/${name}`, {
        method: 'DELETE',
		headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}
