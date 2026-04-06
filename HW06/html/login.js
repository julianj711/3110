const login = () => {
	const username = document.getElementById("username").value;
    	const password = document.getElementById("password").value;

	// Check where to redirect after login
    	const params = new URLSearchParams(window.location.search);
    	const redirect = params.get('redirect') || 'index.html';

    	fetch('/auth/login', {
        	method: 'POST',
        	headers: { 'Content-Type': 'application/json' },
        	body: JSON.stringify({ username, password })
    	})
    	.then(res => res.json())
    	.then(data => {
        	if (data.token) {
            		localStorage.setItem('token', data.token);
            		localStorage.setItem('role', data.role);
            		// Redirect to wherever they came from
            		window.location.href = redirect;
        	} else {
            		document.getElementById("loginMessage").textContent = data.error;
        	}
    	});
}
