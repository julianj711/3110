// Import the 'http' module (built-in to Node.js)
const http = require('http');

// Global array to store items
let players = [
	{ name: "Julian", score: 100},
	{ name: "Hemant", score: 95}
];

// User Authentication
const fs = require('fs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "TheSecretKey123";
const users = JSON.parse(fs.readFileSync('./users.json')).users;

// Middleware that haddles JWT verification from auth header
const authenticate = (req, res) => {
    	const authHeader = req.headers['authorization'];

	// Check if the auth header exists
    	if (!authHeader) {
        	res.writeHead(401, { "Content-Type": "application/json" });
        	res.end(JSON.stringify({ error: "No token provided" }));
        	return null;
    	}

    	// Strip "Bearer " from the header to get just the token
    	const token = authHeader.split(" ")[1];

    	try {
        	// Verify the token and decode the user info baked into it
        	const decoded = jwt.verify(token, SECRET_KEY);
		// contains username and role
		return decoded;
    	} catch {
        	res.writeHead(403, { "Content-Type": "application/json" });
        	res.end(JSON.stringify({ error: "Invalid or expired token" }));
        	return null;
    	}
};
// Function to handle all incoming browser requests
const handleRequest = (req, res) => {

	// Parse the URL to get query parameters
	const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const queryParams = parsedUrl.searchParams;

	// Extract player name from path
	const playerName = parsedUrl.pathname.split("/")[2];

	// Check if the user is visiting /api/user with query params
        if (parsedUrl.pathname === "/api/user") {
                const name = queryParams.get("name");
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end(`Hello, ${name || "Guest"}! This came from a Query Parameter.`);
        }
	// accepts username and password, returns a JWT token when valid
	else if (parsedUrl.pathname === "/auth/login" && req.method === "POST") {
   		 let body = "";
   		 req.on("data", (chunk) => { body += chunk.toString(); });
   		 req.on("end", () => {
        		const { username, password } = JSON.parse(body);

			// Check if user exists with matching username and password
        		const user = users.find(u => u.username === username && u.password === password);

			// Respond with invalid if the username and password dont match
        		if (!user) {
            			res.writeHead(401, { "Content-Type": "application/json" });
            			res.end(JSON.stringify({ error: "Invalid credentials" }));
            			return;
        		}
			// token will have the user's name and role inside
        		const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY);
        		res.writeHead(200, { "Content-Type": "application/json" });
        		res.end(JSON.stringify({ token: token, role: user.role }));
    		});
	}
	// Admin only — creates a new user and saves to users.json
	else if (parsedUrl.pathname === "/auth/register" && req.method === "POST") {

		// Check token first, they must be logged in
    		const user = authenticate(req, res);
    		if (!user) return;

    		// Check role — only admin can create new credentials
    		if (user.role !== "admin") {
        		res.writeHead(403, { "Content-Type": "application/json" });
        		res.end(JSON.stringify({ error: "Only admins can create new credentials" }));
        		return;
    		}

    		let body = "";
    		req.on("data", (chunk) => { body += chunk.toString(); });
    		req.on("end", () => {
        		const { username, password, role } = JSON.parse(body);

        		// Make sure all fields are provided
        		if (!username || !password || !role) {
            			res.writeHead(400, { "Content-Type": "application/json" });
            			res.end(JSON.stringify({ error: "Missing username, password or role" }));
            			return;
        		}

        		// Add the new user and save back to users.json
        		users.push({ username, password, role });
        		fs.writeFileSync('./users.json', JSON.stringify({ users }, null, 2));

        		res.writeHead(201, { "Content-Type": "application/json" });
        		res.end(JSON.stringify({ message: "User created successfully" }));
    		});
	}
	// Check if the user is visiting our /api path
        else if (parsedUrl.pathname === "/api" || parsedUrl.pathname.startsWith("/api/")) {

                // --- HANDLE GET (Read Data) ---
                if (req.method === "GET") {
			const index = queryParams.get("index");

                        // If index is provided, return specific item
                        if (index !== null) {
                                const itemIndex = parseInt(index);
                                if (itemIndex >= 0 && itemIndex < players.length) {
                                        res.writeHead(200, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ player: players[itemIndex], index: itemIndex }));
                                } else {
                                        res.writeHead(404, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ error: "Index out of range" }));
                                }
                        } else {
                                res.writeHead(200, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ players: players, count: players.length }));
                        }

		}else{
			// User have a token
			const user = authenticate(req, res);
            		if (!user) return;

			// Only authors can modify players(correct token)
			if (user.role !== "author") {
    				res.writeHead(403, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: "Only authors can modify players" }));
				return;
			}

			// --- HANDLE POST (Create Data) ---
			if (req.method === "POST") {
	    			let body = "";
    				req.on("data", (chunk) => { body += chunk.toString(); });

    				req.on("end", () => {
	        			let data;

        				try {
            					data = JSON.parse(body);
        				} catch {
            					data = Object.fromEntries(new URLSearchParams(body));
        				}

        				if (data.name && data.score !== undefined) {
            					players.push({ name: data.name, score: parseInt(data.score) });

            					res.writeHead(201, { "Content-Type": "application/json" });
            					res.end(JSON.stringify({
                					message: "Player added",
                					players: players
            					}));
        				} else {
            					res.writeHead(400, { "Content-Type": "application/json" });
            					res.end(JSON.stringify({ error: "Missing name or score!" }));
        				}
    				});
			}
			// --- HANDLE PUT (Update Data) ---
			else if (req.method === "PUT") {
    				let body = "";
				const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
                        	if (player) {
					req.on("data", (chunk) => { body += chunk.toString(); });
    					req.on("end", () => {
        					let data;
        					try {
            						data = JSON.parse(body);
        					} catch {
        			    			data = Object.fromEntries(new URLSearchParams(body));
        					}

        					if (data.score !== undefined) {
            						player.score = parseInt(data.score);
            						res.writeHead(200, { "Content-Type": "application/json" });
            						res.end(JSON.stringify({ message: "Score updated!", players: players }));
        					} else {
            						res.writeHead(400, { "Content-Type": "application/json" });
            						res.end(JSON.stringify({ error: "Missing score" }));
        					}
   					 });
				//PLayer not found
				} else {
					res.writeHead(404, { "Content-Type": "application/json" });
        				res.end(JSON.stringify({ error: "Player not found" }));
				}
			}
			// --- HANDLE DELETE (Delete Data) ---
			else if (req.method === "DELETE") {
				//Player not found
				const playerIndex = players.findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());
				if (playerIndex === -1) {
					res.writeHead(404, { "Content-Type": "application/json" });
        				res.end(JSON.stringify({ error: "Player not found" }));
        				return;
    				}
				const removed = players.splice(playerIndex, 1);
				res.writeHead(200, { "Content-Type": "application/json"});
				res.end(JSON.stringify({
					message: "Player deleted",
					removed: removed[0],
					players: players
				}));
			}
		}
	}
	else{
		res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("404 - Not Found");
	}
};
// Create the server using the logic above
const server = http.createServer(handleRequest);

// Tell the server to listen for traffic on Port 3000
server.listen(3000, () => {
	console.log("Server is running on port 3000...");
});


