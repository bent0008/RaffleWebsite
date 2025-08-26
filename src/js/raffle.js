// Local storage key
const STORAGE_KEY = "raffleEntries";

// Load existing entries
let entries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let winners = [];

// DOM elements
const form = document.getElementById("entry-form");
const tbody = document.getElementById("entry-tbody");
const countSpan = document.getElementById("entry-count");
const drawBtn = document.getElementById("drawBtn");
const redrawBtn = document.getElementById("redrawBtn");
const clearWinnersBtn = document.getElementById("clearWinnersBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const emailInput = form.email;
const phoneInput = form.phone;
const credsMsg = document.getElementById("no-creds");

function validateContact() {
  const hasEmail = emailInput.value.trim() !== "";
  const hasPhone = phoneInput.value.trim() !== "";
  if (!hasEmail && !hasPhone) {
    emailInput.setCustomValidity("Please provide either an email or a phone number.");
    phoneInput.setCustomValidity("Please provide either an email or a phone number.");
    credsMsg.style.display = "block";
    return false;
  } else {
    emailInput.setCustomValidity("");
    phoneInput.setCustomValidity("");
    credsMsg.style.display = "none";
    return true;
  }
}

emailInput.addEventListener("input", validateContact);
phoneInput.addEventListener("input", validateContact);

function saveEntries() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries() {
        tbody.innerHTML = "";
        entries.forEach((entry, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${entry.name}</td>
                        <td>${entry.email ? entry.email : ""}</td>
                        <td>${entry.phone ? entry.phone : ""}</td>
                        <td>${new Date(entry.timestamp).toLocaleString()}</td>
                        <td><button class="delete-btn" data-index="${index}">🗑 Delete</button></td>
                `;

                if (entry.winner) {
                        row.classList.add("winner");
                }

                tbody.appendChild(row);
        });
        document.getElementById("entry-count").textContent = entries.length;

        document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
                        const idx = parseInt(e.target.dataset.index);
                        entries.splice(idx, 1);
                        saveEntries();
                        renderEntries();
                        await autoSave();
    });
  });
}

async function autoSave() {
        try {
                const res = await fetch("/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ entries })
                });
                if (!res.ok) throw new Error(await res.text());
                console.log("Entries auto-saved");
        } catch (err) {
                console.error("Auto-save failed:", err);
        }
}

form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validateContact()) {
                form.reportValidity();
                return;
        }

        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();

        if (!name) return;

        const duplicate = entries.some(
                (entry) =>
                entry.name.toLowerCase() === name.toLowerCase() ||
                (email && entry.email.toLowerCase() === email.toLowerCase()) ||
                (phone && entry.phone.toLowerCase() === phone.toLowerCase())
        );

        if (duplicate) {
                alert("This name, email, or phone is already entered!\nOnly one person per entry!");
                form.reset();
                return;
        }

        entries.push({
                name,
                email,
                phone,
                timestamp: Date.now(),
                winner: false
        });

        saveEntries();
        renderEntries();
        await autoSave();
        form.reset();
});

exportCsvBtn.addEventListener("click", autoSave);

drawBtn.addEventListener("click", async () => {
        if (entries.length === 0) return alert("No entries available!");

        const idx = Math.floor(Math.random() * entries.length);
        entries[idx].winner = true;
        winners.push(entries[idx]);

        saveEntries();
        renderEntries();
        await autoSave();

        alert(`🎉 Winner: ${entries[idx].name} (${entries[idx].email || "no email"}) (${entries[idx].phone || "no phone number"}) `);
});

clearWinnersBtn.addEventListener("click", async () => {
        entries.forEach(e => e.winner = false);
        winners = [];
        saveEntries();
        renderEntries();
        await autoSave();
});

shuffleBtn.addEventListener("click", () => {
        entries = entries
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);

        saveEntries();
        renderEntries();
});

renderEntries();

document.addEventListener("DOMContentLoaded", () => {
        const loginForm = document.getElementById("login-form");
        const logoutBtn = document.getElementById("logoutBtn");
        const drawSection = document.getElementById("draw-section");

        loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const username = document.getElementById("username").value.trim();
                const password = document.getElementById("password").value.trim();

                try {
                        const res = await fetch("/login", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ username, password })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                                loginForm.style.display = "none";
                                logoutBtn.style.display = "inline-block";
                                drawSection.style.display = "block";
                        } else {
                                alert("Invalid credentials. Try again.");
                                document.getElementById("username").value = "";
                                document.getElementById("password").value = "";
                        }
                } catch (err) {
                        console.error("Login error:", err);
                }
        });

        logoutBtn.addEventListener("click", () => {
                loginForm.style.display = "flex";
                logoutBtn.style.display = "none";
                drawSection.style.display = "none";
                document.getElementById("username").value = "";
                document.getElementById("password").value = "";
        });
});
