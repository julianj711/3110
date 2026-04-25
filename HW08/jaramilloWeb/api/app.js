// Import the 'http' module (built-in to Node.js)
const http = require('http');

// User Authentication
const fs = require('fs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "TheSecretKey123";

// Create Database
const Database = require('better-sqlite3');
const db = new Database('./scoreboard.db');

// Create players table
db.exec(`
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        score INTEGER NOT NULL,
        modified_by TEXT DEFAULT 'system'
    )
`);

// Create users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
`);
const count = db.prepare('SELECT COUNT(*) as count FROM players').get();
// Seed default players if the table is empty
if (count.count === 0) {
    db.prepare('INSERT INTO players (name, score) VALUES (?, ?)').run('Julian', 100);
    db.prepare('INSERT INTO players (name, score) VALUES (?, ?)').run('Hemant', 95);
}

// Seed users from users.json if the users table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
    const usersFromFile = JSON.parse(fs.readFileSync('./users.json')).users;
    const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    usersFromFile.forEach(u => insertUser.run(u.username, u.password, u.role));
}

// Store all connected SSE clients
let clients = [];

// Broadcast updated scoreboard to all connected clients
const broadcast = (data) => {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

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

        // SSE conection(Browser connects to receive live updates)
        if (parsedUrl.pathname === "/events") {
                res.writeHead(200, {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive"
                });

                // Add this client to the list
                clients.push(res);

                // Send current scoreboard immediately on connect
                const players = db.prepare('SELECT * FROM players').all();
                res.write(`data: ${JSON.stringify({ players })}\n\n`);

                // Remove client when they disconnect
                req.on("close", () => {
                        clients = clients.filter(c => c !== res);
                });

                return;
        }

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

                        //Check the database directly
                        const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
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

                        // Save to SQLite database
                        const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
                        if (existingUser) {
                                res.writeHead(409, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ error: "Username already exists" }));
                                return;
                        }
                        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, role);

                        res.writeHead(201, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ message: "User created successfully" }));
                });
        }
        // Check if the user is visiting our /api path
        else if (parsedUrl.pathname === "/api" || parsedUrl.pathname.startsWith("/api/")) {

                // --- HANDLE GET (Read Data) ---
                if (req.method === "GET") {

                        // Fetch all players from the database
                        const players = db.prepare('SELECT * FROM players').all();
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ players: players, count: players.length }));

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
                                                // Insert new player into database
                                                db.prepare('INSERT INTO players (name, score, modified_by) VALUES (?, ?, ?)').run(data.name, parseInt(data.score), user.username);
                                                const players = db.prepare('SELECT * FROM players').all();
                                                broadcast({ players });
                                                res.writeHead(201, { "Content-Type": "application/json" });
                                                res.end(JSON.stringify({ message: "Player added", players: players }));
                                        } else {
                                                res.writeHead(400, { "Content-Type": "application/json" });
                                                res.end(JSON.stringify({ error: "Missing name or score!" }));
                                        }
                                });
                        }
                        // --- HANDLE PUT (Update Data) ---
                        else if (req.method === "PUT") {
                                let body = "";
                                const player = db.prepare('SELECT * FROM players WHERE LOWER(name) = LOWER(?)').get(playerName);

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
                                                        // Update score in database
                                                        db.prepare('UPDATE players SET score = ?, modified_by = ? WHERE LOWER(name) = LOWER(?)').run(parseInt(data.score), user.username, playerName);
                                                        const players = db.prepare('SELECT * FROM players').all();
                                                        broadcast({ players });
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
                                // Check if player exists in database
                                const player = db.prepare('SELECT * FROM players WHERE LOWER(name) = LOWER(?)').get(playerName);

                                //Player not found
                                if (!player) {
                                        res.writeHead(404, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ error: "Player not found" }));
                                        return;
                                }
                                // Delete player from database
                                db.prepare('DELETE FROM players WHERE LOWER(name) = LOWER(?)').run(playerName);
                                const players = db.prepare('SELECT * FROM players').all();
                                broadcast({ players });
                                res.writeHead(200, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ message: "Player deleted", players: players }));
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

