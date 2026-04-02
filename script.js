let currentUser = sessionStorage.getItem('activeUser') || null;
let isLoginMode = false;
let tasks = JSON.parse(localStorage.getItem('proTasks')) || [];

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const storiesSection = document.getElementById('stories-section');
const mainNav = document.getElementById('main-nav');
const audio = document.getElementById('alarm-audio');

window.onload = () => {
    if (currentUser) loginSuccess(currentUser);
};

// --- AUTH ---
document.getElementById('toggle-auth').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "User Login" : "Create Account";
    document.getElementById('auth-submit').innerText = isLoginMode ? "Access Dashboard" : "Sign Up";
    document.getElementById('toggle-auth').innerText = isLoginMode ? "New here? Create Account" : "Already have an account? Login";
});

document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (isLoginMode) {
        if (localStorage.getItem(`user_${u}`) === p) {
            loginSuccess(u);
        } else {
            alert("Unauthorized access.");
        }
    } else {
        localStorage.setItem(`user_${u}`, p);
        alert("Account verified. Please log in.");
        isLoginMode = true;
        document.getElementById('toggle-auth').click();
    }
});

function loginSuccess(user) {
    currentUser = user;
    sessionStorage.setItem('activeUser', user);
    authSection.classList.add('hidden');
    mainNav.classList.remove('hidden');
    showPage('dashboard');
    document.getElementById('user-greeting').innerText = `Welcome back, ${user}`;
    renderTasks();
}

function logout() {
    sessionStorage.clear();
    location.reload();
}

// --- NAV ---
function showPage(page) {
    dashboardSection.classList.add('hidden');
    storiesSection.classList.add('hidden');
    if (page === 'dashboard') dashboardSection.classList.remove('hidden');
    if (page === 'stories') storiesSection.classList.remove('hidden');
}

// --- TASKS ---
function addTask() {
    const name = document.getElementById('task-name').value;
    const time = document.getElementById('task-time').value;
    const period = document.getElementById('task-period').value;

    if (!name || !time) return alert("Task parameters required.");

    tasks.push({ id: Date.now(), user: currentUser, name, time, period, status: 'pending' });
    updateStorage();
}

function updateStatus(id, newStatus) {
    tasks = tasks.map(t => t.id === id ? {...t, status: newStatus} : t);
    updateStorage();
    stopAlarm();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    updateStorage();
    stopAlarm();
}

function updateStorage() {
    localStorage.setItem('proTasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('list-render');
    container.innerHTML = '';
    tasks.filter(t => t.user === currentUser).forEach(t => {
        const div = document.createElement('div');
        div.className = `task-item status-${t.status}`;
        div.innerHTML = `
            <div>
                <span style="color:var(--primary); font-size:0.7rem;">${t.period}</span>
                <div style="font-weight:600">${t.name}</div>
                <small>${new Date(t.time).toLocaleString()}</small>
            </div>
            <div class="action-btns">
                <button onclick="updateStatus(${t.id}, 'done')" style="background:var(--success)">✓</button>
                <button onclick="updateStatus(${t.id}, 'failed')" style="background:var(--danger)">X</button>
                <button onclick="deleteTask(${t.id})" style="background:#555;">🗑 Delete</button>
            </div>`;
        container.appendChild(div);
    });
}

// --- ALARM ENGINE ---
setInterval(() => {
    const now = new Date().getTime();
    tasks.forEach(t => {
        const due = new Date(t.time).getTime();
        // Trigger if pending and within 2 minutes of deadline
        if (t.status === 'pending' && (due - now) < 120000 && (due - now) > 0) {
            audio.volume = 1.0; 
            audio.play().catch(e => console.log("User interaction required for audio"));
        }
    });
}, 5000);

function stopAlarm() {
    audio.pause();
    audio.currentTime = 0;
}


function toggleNotifications() {
  document.getElementById('notifBox').classList.toggle('show');
}

// Example: play sound when a notification comes
function notify() {
  toggleNotifications();
  new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3').play();
}

// Optional: trigger notification every 5 seconds (demo)
setInterval(notify, 5000);