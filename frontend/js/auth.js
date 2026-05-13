// ===============================
// TOGGLE PASSWORD FUNCTION
// ===============================
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}


// ===============================
// REGISTER FUNCTION
// ===============================
async function validateRegister(event) {
  event.preventDefault();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const confirm = document.getElementById("reg-confirm").value.trim();
  const errorElement = document.getElementById("register-error");

  errorElement.textContent = "";

  if (!name || !email || !password || !confirm) {
    errorElement.textContent = "All fields are required.";
    return;
  }

  if (!email.endsWith("@gmail.com")) {
    errorElement.textContent = "Please use a valid Gmail address (e.g. you@gmail.com).";
    return;
  }

  if (password !== confirm) {
    errorElement.textContent = "Passwords do not match.";
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorElement.textContent = data.message;
      return;
    }

    alert("Registration successful!");
    window.location.href = "login.html";

  } catch (error) {
    errorElement.textContent = "Server error. Please try again.";
  }
}


// ===============================
// LOGIN FUNCTION
// ===============================
async function validateLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const errorElement = document.getElementById("login-error");

  errorElement.textContent = "";

  if (!email || !password) {
    errorElement.textContent = "All fields are required.";
    return;
  }

  if (!email.endsWith("@gmail.com")) {
    errorElement.textContent = "Please use a valid Gmail address (e.g. you@gmail.com).";
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorElement.textContent = data.message;
      return;
    }

    // Save user properly
    localStorage.setItem("userId", data.user.id);
    localStorage.setItem("userName", data.user.name);

    //alert("Login successful!");

    // Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    errorElement.textContent = "Server error. Please try again.";
  }
}