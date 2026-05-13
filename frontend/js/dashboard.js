const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadMySkills();
  loadSwapRequests();
});

/* =========================
   LOAD MY SKILLS
========================= */
function loadMySkills() {
  const container = document.getElementById("my-skills-list");

  fetch(`/api/skills/user/${userId}`)
    .then(res => res.json())
    .then(skills => {
      container.innerHTML = "";

      if (skills.length === 0) {
        container.innerHTML = `
          <div class="text-center py-4 text-muted border rounded bg-light">
            <i class="bi bi-journal-x fs-1 opacity-50 block mb-2"></i>
            <p class="mb-2">You haven't added any skills yet.</p>
            <a href="add-skill.html" class="btn btn-sm btn-outline-primary">Add Your First Skill</a>
          </div>
        `;
        return;
      }

      skills.forEach(skill => {
        const item = document.createElement("div");
        item.className = "card border-0 shadow-sm mb-2";
        item.innerHTML = `
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-1">${skill.skill_name}</h6>
              <button class="btn btn-sm text-danger p-0" onclick="deleteSkill(${skill.id})" title="Delete Skill">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            <p class="text-muted small mb-0">${skill.skill_description || "No description provided."}</p>
          </div>
        `;
        container.appendChild(item);
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<div class="alert alert-danger">Failed to load skills.</div>`;
    });
}

function deleteSkill(skillId) {
  if (!confirm("Are you sure you want to delete this skill?")) return;

  fetch(`/api/skills/${skillId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  })
  .then(res => res.json())
  .then(data => {
    loadMySkills();
  })
  .catch(err => console.error("Error deleting skill:", err));
}


/* =========================
   LOAD SWAP REQUESTS
========================= */
function loadSwapRequests() {
  const container = document.getElementById("pending-requests");

  fetch(`/api/swaps/user/${userId}`)
    .then(res => res.json())
    .then(requests => {
      container.innerHTML = "";

      if (!requests || requests.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5 text-muted border rounded bg-light">
            <i class="bi bi-inbox fs-1 opacity-50 block mb-2"></i>
            <p class="mb-0">No swap requests yet.</p>
          </div>
        `;
        return;
      }

      requests.forEach(request => {
        const item = document.createElement("div");
        item.className = "card border-0 shadow-sm";
        
        const isReceiver = String(request.receiver_id) === String(userId);
        const isSender = String(request.sender_id) === String(userId);
        const statusClass = `status-${request.status}`; 

        let actionButtons = "";
        if (isReceiver && request.status === "pending") {
          actionButtons = `
            <div class="mt-3 d-flex gap-2">
              <button class="btn btn-success btn-sm flex-grow-1" onclick="promptAcceptRequest(${request.id})"><i class="bi bi-check-circle"></i> Accept</button>
              <button class="btn btn-outline-danger btn-sm flex-grow-1" onclick="declineRequest(${request.id})"><i class="bi bi-x-circle"></i> Decline</button>
            </div>
          `;
        }

        const hasCompleted = isSender ? request.sender_completed : request.receiver_completed;

        // Meeting link section for accepted swaps
        let meetingHtml = "";
        if ((request.status === "accepted" || request.status === "completed") && request.meeting_link && !hasCompleted) {
          meetingHtml = `
            <div class="mt-3 p-3 bg-light rounded border border-success border-opacity-25 shadow-sm">
              <a href="${request.meeting_link}" target="_blank" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">
                <i class="bi bi-camera-video me-1"></i> Join Google Meet
              </a>
            </div>
          `;
        }

        // "Mark as Complete" button — for BOTH sender and receiver
        let learntHtml = "";
        if (request.status === "accepted" && !hasCompleted) {
          const btnText = isSender ? "Mark as Learnt — Add Skill" : "Mark as Complete";
          learntHtml = `
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-success w-100 fw-bold" onclick="markAsLearnt(${request.id}, '${request.skill_name.replace(/'/g, "\\'")}')">
                <i class="bi bi-patch-check-fill me-1"></i> ${btnText}
              </button>
            </div>
          `;
        }

        // Completed badge
        let completedHtml = "";
        if (hasCompleted) {
          completedHtml = `
            <div class="mt-3 p-2 bg-success bg-opacity-10 rounded text-center">
              <i class="bi bi-patch-check-fill text-success me-1"></i>
              <span class="fw-semibold text-success">Skill Learned & Added!</span>
            </div>
          `;
        }
        
        const directionText = isReceiver 
          ? `<strong>${request.sender_name}</strong> wants to learn` 
          : `You requested to learn`;
          
        const peerText = isReceiver ? "" : ` from <strong>${request.receiver_name}</strong>`;

        item.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="fw-bold mb-0 text-primary">${request.skill_name}</h5>
              <span class="status-badge ${statusClass}">${request.status}</span>
            </div>
            
            <p class="text-muted mb-0">
              ${directionText} <span class="badge bg-light text-dark border">${request.skill_name}</span> ${peerText}
            </p>
            
            <p class="small text-muted mt-2 mb-0">
              <i class="bi bi-clock"></i> ${new Date(request.created_at).toLocaleDateString()}
            </p>

            ${actionButtons}
            ${meetingHtml}
            ${learntHtml}
            ${completedHtml}
          </div>
        `;

        container.appendChild(item);
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<div class="alert alert-danger">Failed to load swap requests.</div>`;
    });
}


/* =========================
   ACCEPT WITH GOOGLE MEET LINK
========================= */
function promptAcceptRequest(requestId) {
  const meetingLink = prompt(
    "Paste your Google Meet link below.\n\n" +
    "To create one: go to https://meet.google.com → click 'New meeting' → 'Create a meeting for later' → copy the link.\n\n" +
    "Example: https://meet.google.com/abc-defg-hij"
  );

  if (!meetingLink) return; // User cancelled

  // Basic validation
  if (!meetingLink.startsWith("https://meet.google.com/")) {
    alert("Please enter a valid Google Meet link (starting with https://meet.google.com/)");
    return;
  }

  if (!confirm("Accept this swap request? The meeting link will be emailed to both of you.")) return;

  fetch("/api/swaps/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, meetingLink })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message || "Swap accepted!");
    loadSwapRequests();
  })
  .catch(err => {
    console.error(err);
    alert("Error accepting request. Please try again.");
  });
}

function declineRequest(requestId) {
  if (!confirm("Are you sure you want to decline this request?")) return;

  fetch("/api/swaps/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId })
  })
  .then(res => res.json())
  .then(data => {
    loadSwapRequests();
  });
}


/* =========================
   MARK AS LEARNT
========================= */
function markAsLearnt(requestId, skillName) {
  if (!confirm(`Mark "${skillName}" as learned?\n\nThis will add "` + skillName + `" to your skill profile!`)) return;

  fetch("/api/swaps/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, userId })
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Server error");
    return data;
  })
  .then(data => {
    alert(data.message || "Swap marked as completed!");
    loadMySkills();
    loadSwapRequests();
  })
  .catch(err => {
    console.error("Complete swap error:", err);
    alert("Error: " + err.message);
  });
}


/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}