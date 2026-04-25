const BASE_URL = "https://task-manager-backend-ycyd.onrender.com";

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://task-manager-backend-ycyd.onrender.com/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email, password })
});
    // 👇 HANDLE ERROR RESPONSE PROPERLY
    if (!res.ok) {
      const text = await res.text();
      alert(text); // shows "Wrong password" or "User not found"
      return;
    }

    const data = await res.json();

    localStorage.setItem("token", data.token);

    document.getElementById("loginSection").style.display = "none";
    document.getElementById("taskSection").style.display = "block";

    loadTasks();

  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
}
// ADD TASK
async function addTask() {
  const input = document.getElementById("taskInput");
  const task = input.value;

  // 🔥 Prevent empty task (you already added)
  if (!task.trim()) {
    alert("Enter task");
    return;
  }

  // 🔥 Send to backend
  const res = await fetch("https://task-manager-backend-ycyd.onrender.com/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ text: task })
  });

  // 🔥 Handle error
  if (!res.ok) {
    alert("Failed to add task");
    return;
  }

  // ✅ STEP 3 (IMPORTANT)
  input.value = "";

  // 🔄 Reload tasks
  loadTasks();
}

// LOAD TASKS
async function loadTasks() {
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: {
      "Authorization": localStorage.getItem("token")
    }
  });

  const tasks = await res.json();
  
if (tasks.length === 0) {
  taskList.innerHTML = "<p>No tasks yet</p>";
  return;
}
  taskList.innerHTML = "";

  tasks.forEach(t => {
    const li = document.createElement("li");

    li.innerHTML = `
      <input type="checkbox" 
  ${t.completed ? "checked" : ""} 
  onchange="toggleTask('${t._id}', this.checked)">

      <span style="${t.completed ? 'text-decoration: line-through;' : ''}">
        ${t.text}
      </span>

      <button onclick="editTask('${t._id}', '${t.text}')">Edit</button>
<button onclick="deleteTask('${t._id}')">Delete</button>
    `;

    taskList.prepend(li);
  });
}
async function deleteTask(id) {
  if (!confirm("Are you sure?")) return;

  await fetch(`https://task-manager-backend-ycyd.onrender.com/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": localStorage.getItem("token")
    }
  });

  loadTasks();
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");

  document.getElementById("loginSection").style.display = "block";
  document.getElementById("taskSection").style.display = "none";
}

// NAVIGATION
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (password !== confirm) {
    alert("Passwords do not match");
    return;
  }

  try {
    const res = await fetch("https://task-manager-backend-ycyd.onrender.com/signup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email, password })
});
    const text = await res.text();
    alert(text);

    // ✅ THIS WAS MISSING
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    alert("Signup failed");
  }
}
function goToSignup() {
  window.location.href = "signup.html";
}
function goToLogin() {
  window.location.href = "index.html";
}
async function toggleTask(id, completed) {
  await fetch(`https://task-manager-backend-ycyd.onrender.com/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ completed })
  });

  loadTasks();
}
 
async function toggleTask(id, completed) { 
  await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ completed })
  });

  loadTasks();
}
async function editTask(id, oldText) {
  const newText = prompt("Edit task:", oldText);

  if (!newText) return;

  await fetch(`${BASE_URL}/tasks/edit/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": localStorage.getItem("token")
    },
    body: JSON.stringify({ text: newText })
  });

  loadTasks();
}
