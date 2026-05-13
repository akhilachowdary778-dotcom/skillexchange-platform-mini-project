const userId = localStorage.getItem("userId");

if (!userId) {
  window.location.href = "login.html";
}

document
  .getElementById("addSkillForm")
  .addEventListener("submit", addSkill);

function addSkill(e) {

  e.preventDefault();

  const skillName = document
    .getElementById("skill-name")
    .value
    .trim();

  const skillDescription = document
    .getElementById("skill-description")
    .value
    .trim();

  const error = document.getElementById("skill-error");

  error.textContent = "";

  // Only skill name required
  if (!skillName) {
    error.textContent = "Skill name is required";
    return;
  }

  fetch("/api/skills", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: userId,
      skillName: skillName,
      skillDescription: skillDescription
    })
  })
  .then(res => res.json())
  .then(data => {

    if (data.message === "Skill added successfully") {

      alert("Skill added successfully");
      window.location.href = "dashboard.html";

    } else {

      error.textContent = data.message;

    }

  })
  .catch(() => {
    error.textContent = "Server error";
  });

}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}