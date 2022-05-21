/*
    Basic express.js server to serve built app from dist folder
*/
const path = require("path");
const express = require("express");

// Get config
const config = require("../src/config.json");

// Create server object
const app = express();

// Add middleware to serve static files from frontend/dist folder.
app.use(express.static(path.join(__dirname, "..", "dist")));

// Return index.js by default, when resource is not found.
// This allows to use React Router for routing and returning resources matching the URL.
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

// Start express server
app.listen(config.server.port, () => {
  console.log(`server started on port ${config.server.port}`);
});
