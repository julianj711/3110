// Redirect to login if no token found
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

// Redirect authors away — this page is for admins only
if (localStorage.getItem('role') === 'author') {
    window.location.href = 'scoreboard.html';
}

const register = () => {
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    // Grab the token from localStorage — must be logged in as admin
    const token = localStorage.getItem('token');

    fetch('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // send token with request
        },
        body: JSON.stringify({ username, password, role })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("registerMessage").textContent = data.message || data.error;
    });
}
