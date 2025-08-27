import express from "express";
import session from "express-session";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 9000;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Static files
app.use(express.static(path.join(__dirname, "src")));

// Data paths
const dataDir = path.join(process.cwd(), "data");
const csvPath = path.join(dataDir, "raffle_entries.csv");
const authPath = path.join(dataDir, "auth.json");
const entriesPath = path.join(dataDir, "entries.json");

// Ensure data dir exists
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Load existing entries or initialize empty
let entries = fs.existsSync(entriesPath)
  ? JSON.parse(fs.readFileSync(entriesPath, "utf8"))
  : [];

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ success: false, message: "Unauthorized" });
}

// Serve admin panel only if logged in
app.use("/admin", requireAuth, express.static(path.join(__dirname, "src/admin")));

// Serve index HTML
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "src/index.html")));
app.get("/admin", requireAuth, (req, res) => res.sendFile(path.join(__dirname, "src/admin.html")));

// --- Entry endpoints ---

// Fetch all entries (admin only)
app.get("/entries", requireAuth, (req, res) => {
  res.json(entries);
});

// Add new entry (public)
app.post("/add-entry", (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || (!email && !phone)) return res.status(400).send("Name and email/phone required");

  // Check for duplicates
  const duplicate = entries.some(e =>
    e.name.toLowerCase() === name.toLowerCase() ||
    (email && e.email?.toLowerCase() === email.toLowerCase()) ||
    (phone && e.phone?.toLowerCase() === phone.toLowerCase())
  );
  if (duplicate) return res.status(400).send("Duplicate entry");

  const newEntry = { id: uuidv4(), name, email, phone, winner: false, timestamp: Date.now() };
  entries.push(newEntry);
  fs.writeFileSync(entriesPath, JSON.stringify(entries, null, 2));
  res.json({ success: true });
});

// Delete entry (admin only)
app.delete("/delete-entry/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  entries = entries.filter(e => e.id !== id);
  fs.writeFileSync(entriesPath, JSON.stringify(entries, null, 2));
  res.json({ success: true });
});

// Save entries to CSV (admin only)
app.post("/save", requireAuth, (req, res) => {
  const header = ["Name", "Email", "Phone Number", "Timestamp", "Winner"];
  const rows = entries.map(e => [
    e.name || "",
    e.email || "",
    e.phone || "",
    new Date(e.timestamp).toISOString(),
    e.winner ? "YES" : "NO"
  ]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");

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
  if (!fs.existsSync(authPath)) return res.status(500).json({ success: false, message: "Auth file missing" });

  const { username: storedUser, password: storedPass } = JSON.parse(fs.readFileSync(authPath, "utf8"));
  if (username === storedUser && password === storedPass) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Logout endpoint
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));