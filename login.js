const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const actionBtn = document.getElementById('action-btn');
const guestBtn = document.getElementById('guest-btn');
const toggleLink = document.getElementById('toggle-link');
const errorMsg = document.getElementById('error-msg');

let isRegistering = false;

const SEED_USERS = [
    { username: "bob", password: "bobpass" },
    { username: "triniman", password: "pass" }
];

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

function hideError() {
    errorMsg.style.display = 'none';
}

function loadUsers() {
    const local = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    if (local.length === 0) {
        localStorage.setItem('registeredUsers', JSON.stringify(SEED_USERS));
        return SEED_USERS;
    }
    return local;
}

async function getFlag() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const geo = await res.json();
        if (geo.country_code) {
            const cp = geo.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt());
            return String.fromCodePoint(...cp);
        }
    } catch(e) {}
    return "";
}

function enterChat(username, guest) {
    getFlag().then(flag => {
        sessionStorage.setItem('chatUser', JSON.stringify({
            username, role: guest ? 'guest' : 'user', guest, flag
        }));
        window.location.href = 'index.html';
    });
}

// Toggle between Sign In and Register
toggleLink.addEventListener('click', () => {
    isRegistering = !isRegistering;
    hideError();
    actionBtn.textContent = isRegistering ? 'Register' : 'Sign In';
    toggleLink.textContent = isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register';
});

// Main action button (login or register)
actionBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!username || !password) { showError('Please enter both username and password.'); return; }

    const users = loadUsers();

    if (isRegistering) {
        if (users.find(u => u.username === username)) { showError('Username already taken.'); return; }
        users.push({ username, password });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        enterChat(username, false);
    } else {
        const match = users.find(u => u.username === username && u.password === password);
        if (!match) { showError('Invalid username or password.'); return; }
        enterChat(username, false);
    }
});

// Guest
guestBtn.addEventListener('click', () => {
    guestBtn.textContent = 'Locating...';
    guestBtn.disabled = true;
    const guestName = 'Guest_' + Math.floor(Math.random() * 9000 + 1000);
    enterChat(guestName, true);
});

passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') actionBtn.click(); });