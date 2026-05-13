const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "login.html";
}

let allUsers = [];
let allSkills = [];
let selectedReceiverId = null;
let selectedSkillId = null;

const swapModal = new bootstrap.Modal(document.getElementById('swapModal'));

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  
  document.getElementById("user-search").addEventListener("input", function(e) {
    const term = e.target.value.toLowerCase();
    filterUsers(term);
  });

  document.getElementById("confirm-swap-btn").addEventListener("click", submitSwapRequest);
});

/* =========================
   LOAD DATA
========================= */
async function loadData() {
  try {
    const [usersRes, skillsRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/skills")
    ]);
    
    allUsers = await usersRes.json();
    allSkills = await skillsRes.json();
    
    // Filter out current user from browse list
    allUsers = allUsers.filter(u => String(u.id) !== String(userId));
    
    displayUsers(allUsers);
  } catch (err) {
    console.error("Error loading data:", err);
    document.getElementById("users-list").innerHTML = `<div class="alert alert-danger w-100 text-center">Failed to load platform users.</div>`;
  }
}

/* =========================
   DISPLAY USERS
========================= */
function displayUsers(users) {
  const container = document.getElementById("users-list");
  container.innerHTML = "";

  if (users.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted border rounded bg-white shadow-sm mt-3">
        <i class="bi bi-search fs-1 opacity-50 block mb-3"></i>
        <p class="mb-0">No users found matching your criteria.</p>
      </div>
    `;
    return;
  }

  users.forEach(user => {
    // Generate skill badges
    let skillsHtml = "";
    if (user.skill_list) {
      const skillsArr = user.skill_list.split(",");
      skillsHtml = skillsArr.map(s => `<span class="badge bg-light text-dark border me-1 mb-1">${s.trim()}</span>`).join("");
    } else {
      skillsHtml = `<span class="text-muted small fst-italic">No specific skills listed yet</span>`;
    }

    const card = document.createElement("div");
    card.className = "col-lg-4 col-md-6 mb-4 d-flex align-items-stretch";
    
    card.innerHTML = `
      <div class="dashboard-card w-100 shadow-sm p-4 rounded bg-white d-flex flex-column">
        <div class="d-flex align-items-center mb-3">
          <div class="bg-light rounded-circle d-flex justify-content-center align-items-center text-secondary me-3" style="width: 50px; height: 50px;">
            <i class="bi bi-person fs-3"></i>
          </div>
          <div>
            <h5 class="fw-bold mb-0">${user.name}</h5>
            <div class="small text-muted text-truncate" style="max-width: 200px;">${user.bio || "Member"}</div>
          </div>
        </div>
        
        <div class="mb-3 flex-grow-1">
          <p class="small fw-semibold text-warning mb-1"><i class="bi bi-star-fill"></i> Can Teach:</p>
          <div class="d-flex flex-wrap">${skillsHtml}</div>
          
          <div class="mt-3">
            <p class="small fw-semibold text-primary mb-1"><i class="bi bi-search"></i> Wants to Learn:</p>
            <p class="small text-muted mb-0">${user.skills_wanted || "Open to suggestions"}</p>
          </div>
        </div>
        
        <button class="btn btn-outline-primary w-100 mt-2" onclick="openSwapModal(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
          <i class="bi bi-arrow-left-right me-1"></i> Request Swap
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

function filterUsers(term) {
  if (!term) return displayUsers(allUsers);
  
  const filtered = allUsers.filter(u => {
    return (u.name && u.name.toLowerCase().includes(term)) ||
           (u.skill_list && u.skill_list.toLowerCase().includes(term)) ||
           (u.bio && u.bio.toLowerCase().includes(term)) ||
           (u.skills_offered && u.skills_offered.toLowerCase().includes(term)) ||
           (u.skills_wanted && u.skills_wanted.toLowerCase().includes(term));
  });
  
  displayUsers(filtered);
}

/* =========================
   SWAP MODAL LOGIC
========================= */
function openSwapModal(receiverId, receiverName) {
  selectedReceiverId = receiverId;
  selectedSkillId = null;
  document.getElementById("swap-error").classList.add("d-none");
  document.getElementById("swap-receiver-name").textContent = receiverName;
  
  const skillsContainer = document.getElementById("swap-skills-list");
  skillsContainer.innerHTML = "";
  
  // Find specific skills offered by this receiver
  const receiverSpecificSkills = allSkills.filter(s => String(s.user_id) === String(receiverId));
  
  if (receiverSpecificSkills.length === 0) {
    skillsContainer.innerHTML = `<p class="text-muted small italic">This user hasn't added any specific platform skills to request yet.</p>`;
    document.getElementById("confirm-swap-btn").disabled = true;
  } else {
    document.getElementById("confirm-swap-btn").disabled = false;
    
    receiverSpecificSkills.forEach((skill, index) => {
      const radioHtml = `
        <div class="form-check border rounded p-3 bg-light cursor-pointer" onclick="selectSkill(${skill.id})">
          <input class="form-check-input ms-0 me-2" type="radio" name="swapSkill" id="skill_${skill.id}" value="${skill.id}" ${index === 0 ? "checked" : ""}>
          <label class="form-check-label w-100" for="skill_${skill.id}" style="cursor: pointer;">
            <div class="fw-bold">${skill.skill_name}</div>
            <div class="small text-muted">${skill.skill_description || "No description"}</div>
          </label>
        </div>
      `;
      skillsContainer.innerHTML += radioHtml;
    });
    
    // Auto select first
    if(receiverSpecificSkills[0]) selectedSkillId = receiverSpecificSkills[0].id;
  }
  
  swapModal.show();
}

// Global helper for radio selection
window.selectSkill = function(id) {
  selectedSkillId = id;
  document.getElementById(`skill_${id}`).checked = true;
};

async function submitSwapRequest() {
  if (!selectedReceiverId || !selectedSkillId) return;
  
  const btn = document.getElementById("confirm-swap-btn");
  const err = document.getElementById("swap-error");
  
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Sending...`;
  btn.disabled = true;
  err.classList.add("d-none");
  
  try {
    const res = await fetch("/api/swaps/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: userId,
        receiverId: selectedReceiverId,
        skillId: selectedSkillId
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      swapModal.hide();
      
      // Temporary success feedback (toast replacement)
      alert("Swap Request sent successfully! You can track it in your Dashboard.");
    } else {
      err.textContent = data.message || "Failed to send request.";
      err.classList.remove("d-none");
    }
  } catch (error) {
    err.textContent = "Server error. Please try again.";
    err.classList.remove("d-none");
  } finally {
    btn.innerHTML = `Send Request`;
    btn.disabled = false;
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}