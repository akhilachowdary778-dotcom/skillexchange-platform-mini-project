const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", loadProfile);

const form = document.getElementById("profile-form");
form.addEventListener("submit", saveProfile);

/* =========================
   LOAD PROFILE
========================= */
function loadProfile() {
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(user => {
      document.getElementById("display-name").textContent = user.name;
      document.getElementById("display-email").textContent = user.email;
      
      document.getElementById("profile-name").value = user.name || "";
      document.getElementById("profile-bio").value = user.bio || "";
      document.getElementById("profile-offered").value = user.skills_offered || "";
      document.getElementById("profile-wanted").value = user.skills_wanted || "";
    })
    .catch(err => console.error("Error loading profile:", err));
}

/* =========================
   SAVE PROFILE
========================= */
async function saveProfile(e) {
  e.preventDefault();
  
  const name = document.getElementById("profile-name").value.trim();
  const bio = document.getElementById("profile-bio").value.trim();
  const skillsOffered = document.getElementById("profile-offered").value.trim();
  const skillsWanted = document.getElementById("profile-wanted").value.trim();
  const messageEl = document.getElementById("profile-message");
  
  messageEl.innerHTML = `<span class="text-muted spinner-border spinner-border-sm me-2"></span> Saving...`;

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, skillsOffered, skillsWanted })
    });
    
    if (response.ok) {
      document.getElementById("display-name").textContent = name;
      localStorage.setItem("userName", name);
      messageEl.innerHTML = `<div class="alert alert-success py-2 mt-2 mb-0 border-0"><i class="bi bi-check-circle-fill me-2"></i> Profile saved successfully!</div>`;
      setTimeout(() => messageEl.innerHTML = "", 3000);
    } else {
      const error = await response.json();
      messageEl.innerHTML = `<div class="alert alert-danger py-2 mt-2 mb-0 border-0">${error.message || "Failed to save profile."}</div>`;
    }
  } catch (error) {
    messageEl.innerHTML = `<div class="alert alert-danger py-2 mt-2 mb-0 border-0">Server error. Please try again.</div>`;
  }
}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
