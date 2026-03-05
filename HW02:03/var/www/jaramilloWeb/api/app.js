
// Import the 'http' module (built-in to Node.js)
const http = require('http');

//Global array to store items
let items = ["apple", "banana", "orange"];

// Function to handle all incoming browser requests
const handleRequest = (req, res) => {

        // Parse the URL to get query parameters
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const queryParams = parsedUrl.searchParams;


        // Check if the user is visiting /api/user with query params
        if (parsedUrl.pathname === "/api/user") {
                const name = queryParams.get("name");
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end(`Hello, ${name || "Guest"}! This came from a Query Parameter.`);
        }

        // Check if the user is visiting our /api path
        else if (parsedUrl.pathname === "/api") {

                // --- HANDLE GET (Read Data) ---
                if (req.method === "GET") {
                        const index = queryParams.get("index");

                        // If index is provided, return specific item
                        if (index !== null) {
                                const itemIndex = parseInt(index);
                                if (itemIndex >= 0 && itemIndex < items.length) {
                                        res.writeHead(200, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ item: items[itemIndex], index: itemIndex }));
                                } else {
                                        res.writeHead(404, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ error: "Index out of range" }));
                                }
                        } else {
                                res.writeHead(200, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ items: items, count: items.length }));
                        }
                }

                // --- HANDLE POST (Create Data) ---
                else if (req.method === "POST") {
                        let body = "";
                        req.on("data", (chunk) => { body += chunk.toString(); });

                        req.on("end", () => {
                                let data;

                                try {
                                        data = JSON.parse(body);
                                } catch {
                                        data = Object.fromEntries(new URLSearchParams(body));
                                }

                                if (data.item) {
                                        items.push(data.item);

                                        res.writeHead(201, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({
                                                message: "Item added",
                                                items: items
                                        }));
                                } else {
                                        res.writeHead(400, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ error: "Missing item" }));
                                }
                        });
                }
                // --- HANDLE PUT (Update Data) ---
                else if (req.method === "PUT") {
                        let body = "";
                        req.on("data", (chunk) => { body += chunk.toString(); });
                        req.on("end", () => {
                                // In a real app, you'd use this 'body' to update a database
                                res.writeHead(200, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ message: "Data Updated Successfully!" }));
                        });

                }



                // --- HANDLE DELETE (Delete Data) ---
                else if (req.method === "DELETE") {
                        const index = queryParams.get("index");

                        if (index !== null) {
                                const itemIndex = parseInt(index);

                                if (itemIndex >= 0 && itemIndex < items.length) {
                                        const removed = items.splice(itemIndex, 1);

                                        res.writeHead(200, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({
                                                message: "Item deleted",
                                                removed: removed[0],
                                                items: items
                                        }));
                                } else {
                                        res.writeHead(404, { "Content-Type": "application/json" });
                                        res.end(JSON.stringify({ error: "Index out of range" }));
                                }
                        } else {
                                res.writeHead(400, { "Content-Type": "application/json" });
                                res.end(JSON.stringify({ error: "Missing index" }));
                        }
                }
        }

        // Handle specific sub-routes
        else if (parsedUrl.pathname === "/api/test") {
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("Good afternoon from test");
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