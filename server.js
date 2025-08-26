import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 9000;

// For joining the server and html, css, js
app.use(express.static("./src"));

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// CSV Path Within Docker Container
const dataDir = path.join(process.cwd(), "data"); // docker volume mounted here
const csvPath = path.join(dataDir, "raffle_entries.csv");
const authPath = path.join(dataDir, "auth.json");


// In case Dir doesn't Exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Save raffle entries to CSV
app.post("/save", (req, res) => {
  const entries = req.body.entries;

  if (!entries || !Array.isArray(entries)) {
    return res.status(400).send("Invalid data format");
  }

  // Build CSV
  const header = ["Name", "Email", "Phone Number", "Timestamp", "Winner"];
  const rows = entries.map(e => [
    e.name || "",
    e.email || "",
    e.phone || "",
    new Date(e.timestamp).toISOString(),
    e.winner ? "YES" : "NO"
  ]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");

  // Write to /app/data
  try {
    fs.writeFileSync(csvPath, csv, "utf8");
    res.send("CSV saved successfully!");
  } catch (err) {
    console.error("Error writing CSV:", err);
    res.status(500).send("Failed to save CSV");
  }
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!fs.existsSync(authPath)) {
    return res.status(500).json({ success: false, message: "Auth file missing" });
  }

  const authData = JSON.parse(fs.readFileSync(authPath, "utf8"));
  const { username: storedUser, password: storedPass } = authData;

  if (username === storedUser && password === storedPass) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});