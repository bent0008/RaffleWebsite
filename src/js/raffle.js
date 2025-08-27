let entries = [];
let winners = [];

// --- Render entries table (admin only) ---
function renderEntries() {
  const tbody = document.getElementById("entry-tbody");
  const countSpan = document.getElementById("entry-count");
  if (!tbody) return;

  tbody.innerHTML = "";
  entries.forEach((entry, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${entry.email || ""}</td>
      <td>${entry.phone || ""}</td>
      <td>${entry.winner ? "YES" : "NO"}</td>
      <td><button class="delete-btn" data-id="${entry.id}">🗑 Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  if (countSpan) countSpan.textContent = entries.length;

  // Delete button
  tbody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      try {
        const res = await fetch(`/delete-entry/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        await fetchEntries();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    });
  });
}

// Fetch entries from server
async function fetchEntries() {
  try {
    const res = await fetch("/entries");
    if (!res.ok) throw new Error(await res.text());
    entries = await res.json();
    renderEntries();
  } catch (err) {
    console.error("Failed to fetch entries:", err);
  }
}

// Add entry
async function addEntry(entry) {
  try {
    const res = await fetch("/add-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error(await res.text());
    alert("Entry submitted successfully!");
  } catch (err) {
    console.error("Failed to submit entry:", err);
    alert("Failed to submit entry.");
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logoutBtn");
  const entryForm = document.getElementById("entry-form");

  // Public entry form
  if (entryForm) {
    const emailInput = entryForm.email;
    const phoneInput = entryForm.phone;
    const credsMsg   = document.getElementById("no-creds");

    function validateContact() {
      const hasEmail = emailInput.value.trim() !== "";
      const hasPhone = phoneInput.value.trim() !== "";
      if (!hasEmail && !hasPhone) {
        emailInput.setCustomValidity("Please provide either an email or a phone number.");
        phoneInput.setCustomValidity("Please provide either an email or a phone number.");
        if (credsMsg) credsMsg.style.display = "block";
        return false;
      } else {
        emailInput.setCustomValidity("");
        phoneInput.setCustomValidity("");
        if (credsMsg) credsMsg.style.display = "none";
        return true;
      }
    }
    emailInput.addEventListener("input", validateContact);
    phoneInput.addEventListener("input", validateContact);

    entryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateContact()) {
        entryForm.reportValidity();
        return;
      }

      const name  = entryForm.name.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      if (!name) return;

      try {
        await addEntry({ name, email, phone });
        entryForm.reset();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Admin login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.location.href = "/admin";
        } else {
          alert("Invalid credentials. Try again.");
          loginForm.reset();
        }
      } catch (err) {
        console.error("Login error:", err);
      }
    });
  }

  // Admin page
  const drawSection      = document.getElementById("draw-section");
  const exportCsvBtn     = document.getElementById("exportCsvBtn");
  const shuffleBtn       = document.getElementById("shuffleBtn");
  const clearWinnersBtn  = document.getElementById("clearWinnersBtn");
  const drawBtn          = document.getElementById("drawBtn");

  if (drawSection) {
    fetchEntries();

    // Export CSV
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", async () => {
        try {
          await fetch("/save", { method: "POST" });
          alert("CSV saved on server!");
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Shuffle entries
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", () => {
        entries = entries
          .map(value => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);
        renderEntries();
      });
    }

    // Clear winners
    if (clearWinnersBtn) {
      clearWinnersBtn.addEventListener("click", async () => {
        entries.forEach(e => e.winner = false);
        winners = [];
        try {
          await fetch("/save", { method: "POST" });
          renderEntries();
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Draw winner
    if (drawBtn) {
      drawBtn.addEventListener("click", async () => {
        if (entries.length === 0) return alert("No entries available!");
        const idx = Math.floor(Math.random() * entries.length);
        entries[idx].winner = true;
        winners.push(entries[idx]);

        try {
          await fetch("/save", { method: "POST" });
          renderEntries();
          alert(`🎉 Winner: ${entries[idx].name} (${entries[idx].email || "no email"}) (${entries[idx].phone || "no phone"})`);
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await fetch("/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
      });
    }
  }
});