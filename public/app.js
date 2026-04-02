const $ = id => document.getElementById(id), alarm = $('alarm-sound');
let tasks = JSON.parse(localStorage.getItem('pro_tasks')) || [], isLogin = true;

$('current-date').innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// --- AUTH LOGIC ---
const toggleAuthMode = () => {
    isLogin = !isLogin;
    $('auth-title').innerText = isLogin ? "Secure Login" : "Create Account";
    $('auth-subtitle').innerText = isLogin ? "Welcome back" : "Join the workflow";
    $('auth-btn-text').innerText = isLogin ? "Continue" : "Register";
    $('signup-fields').classList.toggle('hidden');
    $('toggle-text').innerText = isLogin ? "No account?" : "Have an account?";
};

const handleAuth = () => {
    if ($('user-email').value.includes('@') && $('user-pass').value.length > 3) {
        $('auth-layer').classList.add('hidden'); // Hide Login
        $('workspace').classList.remove('hidden'); // Show Dashboard
        renderTasks();
        if (Notification.permission !== "granted") Notification.requestPermission();
        alarm.play().then(() => { alarm.pause(); alarm.currentTime = 0; });
    } else alert("Invalid credentials");
};

const logout = () => {
    $('workspace').classList.add('hidden'); // Hide Dashboard
    $('auth-layer').classList.remove('hidden'); // Show Login
    stopAlarm();
};

// --- ALARM & NOTIFICATIONS ---
const stopAlarm = () => { alarm.pause(); alarm.currentTime = 0; };

const triggerNotification = (name, isFinal) => {
    if (Notification.permission === "granted") {
        new Notification(isFinal ? "🚨 TASK DUE" : "⚠️ ALMOST TIME", {
            body: isFinal ? `Task "${name}" is due now!` : `"${name}" starts in 15m.`,
            requireInteraction: isFinal
        }).onclick = () => { window.focus(); stopAlarm(); };
    }
    if (isFinal) { alarm.play(); setTimeout(stopAlarm, 20000); }
};

// --- TASK MANAGEMENT ---
const createTask = () => {
    const [n, d] = [$('task-name'), $('task-deadline')];
    if (!n.value || !d.value) return;
    tasks.push({ id: Date.now(), name: n.value, deadline: d.value, completed: false, warned: false, finalAlert: false });
    n.value = ''; saveAndRender();
};

const toggleTask = id => { tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t); stopAlarm(); saveAndRender(); };
const deleteTask = id => { tasks = tasks.filter(t => t.id !== id); saveAndRender(); };
const saveAndRender = () => { localStorage.setItem('pro_tasks', JSON.stringify(tasks)); renderTasks(); };

function renderTasks() {
    $('task-grid').innerHTML = tasks.map(t => {
        const diff = new Date(t.deadline) - Date.now(), overdue = diff <= 0 && !t.completed;
        
        // Dynamic Status Icon: Checkmark for done, Cross for not done
        const statusIcon = t.completed 
            ? '<span class="text-green-500 mr-2">✔</span>' 
            : '<span class="text-red-500 mr-2">✘</span>';

        return `
        <div class="glass-card p-6 rounded-3xl flex flex-col justify-between ${t.completed ? 'task-done' : overdue ? 'urgent-pulse' : ''}">
            <div>
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-bold uppercase p-1 bg-zinc-800 rounded ${overdue ? 'text-red-500' : 'text-indigo-400'}">
                        ${overdue ? 'Overdue' : 'Planned'}
                    </span>
                    <button onclick="deleteTask(${t.id})" class="text-zinc-600 hover:text-red-500 transition">✕</button>
                </div>
                <h3 class="text-lg font-bold flex items-center">${statusIcon} ${t.name}</h3>
                <p class="text-xs text-zinc-500 mt-1">${new Date(t.deadline).toLocaleString()}</p>
            </div>
            <button onclick="toggleTask(${t.id})" class="mt-6 w-full py-2 border border-zinc-800 rounded-xl hover:bg-white hover:text-black font-bold transition">
                ${t.completed ? 'Mark Not Done' : 'Mark Done'}
            </button>
        </div>`;
    }).join('');

    const done = tasks.filter(t => t.completed).length;
    $('completion-rate').innerText = tasks.length ? Math.round((done / tasks.length) * 100) + "%" : "0%";
    if (window.lucide) lucide.createIcons();
}

// Watchdog interval remains the same
setInterval(() => {
    let updated = false;
    tasks.forEach(t => {
        if (t.completed) return;
        const diff = new Date(t.deadline) - Date.now();
        if (diff > 0 && diff < 900000 && !t.warned) t.warned = updated = triggerNotification(t.name, false) || true;
        if (diff <= 0 && !t.finalAlert) t.finalAlert = updated = triggerNotification(t.name, true) || true;
    });
    if (updated) saveAndRender();
}, 10000);