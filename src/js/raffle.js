
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
		`;

		if (entry.winner) {
			row.classList.add("winner");
		}

		tbody.appendChild(row);
	});
	countSpan.textContent = entries.length;
}


// Export CSV Automatically
async function autoSave() {
  try {
    await fetch("http://localhost:9000/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries })
    });
    console.log("Entries auto-saved");
  } catch (err) {
    console.error("Auto-save failed:", err);
  }
}


// Add entry
form.addEventListener("submit", (e) => {
	e.preventDefault();
	const name = form.name.value.trim();
	const email = form.email.value.trim();
	const phone = form.phone.value.trim();

	if (!name) return;

	// Check for dupes
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
	autoSave();
	form.reset();
});


// Export CSV Manually
exportCsvBtn.addEventListener("click", autoSave);


// Draw winner
drawBtn.addEventListener("click", async () => {
	if (entries.length === 0) return alert("No entries available!");

	const idx = Math.floor(Math.random() * entries.length);
	entries[idx].winner = true;
	winners.push(entries[idx]);

	saveEntries();
	renderEntries();
	autoSave();

	alert(`🎉 Winner: ${entries[idx].name} (${entries[idx].email || "no email"}) (${entries[idx].phone || "no phone number"}) `);
});

// Clear winner
clearWinnersBtn.addEventListener("click", () => {
	entries.forEach(e => e.winner = false);
	winners = [];
	saveEntries();
	renderEntries();
	autoSave();
});

// Add Delete Button to Rows
function renderEntries() {
  const tbody = document.getElementById("entry-tbody");
  tbody.innerHTML = "";

  entries.forEach((entry, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.email || ""}</td>
      <td>${entry.phone || ""}</td>
      <td>${entry.winner ? "YES" : "NO"}</td>
      <td><button class="delete-btn" data-index="${index}">🗑️ Delete</button></td>
    `;

    tbody.appendChild(tr);
  });

  document.getElementById("entry-count").textContent = entries.length;

  // Add click listeners for delete buttons
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const idx = parseInt(e.target.dataset.index);
      entries.splice(idx, 1);
      saveEntries();
      renderEntries();
      autoSave();
    });
  });
}

// Shuffle
shuffleBtn.addEventListener("click", () => {
	entries = entries
		.map(value => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

	saveEntries();
	renderEntries();
});

// Initial render
renderEntries();

// Login & Logout
document.addEventListener("DOMContentLoaded", () => {
	const loginForm = document.getElementById("login-form");
	const logoutBtn = document.getElementById("logoutBtn");
	const drawSection = document.getElementById("draw-section");

	// Credentials
	const SALT = "JaxLUG1586!";
	const USERNAME_HASH = "246d00e0d3bf10da097f238f124bb3b3c8e3441d64c31abf48cdb0f9cd1760a3";
	const PASSWORD_HASH = "5fcfce99c98c2605dcf83a28e1ed2807afa5f6682081244b3825e77628244b97";

	async function hashWithSalt(input, salt) {
		const encoder = new TextEncoder();
		const data = encoder.encode(input + salt);
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
	}

	loginForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const username = document.getElementById("username").value.trim();
		const password = document.getElementById("password").value.trim();

		// Hash inputs
		const userHash = await hashWithSalt(username, SALT);
		const passHash = await hashWithSalt(password, SALT);


		if (userHash === USERNAME_HASH && passHash === PASSWORD_HASH) {
		  // Successful login
			loginForm.style.display = "none";
			logoutBtn.style.display = "inline-block";
			drawSection.style.display = "block";
		} else {
			document.getElementById("username").value = "";
			document.getElementById("password").value = "";
			alert("Invalid credentials. Try again.");
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


document.getElementById("entry-form").addEventListener("submit", function(e) {
	const email = document.getElementById("email").value.trim();
	const phone = document.getElementById("phone").value.trim();
	const noCred = document.getElementById("no-cred");

	if (!email && !phone) {
		e.preventDefault();
		noCred.style.display = "block";
}
});