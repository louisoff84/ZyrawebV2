// Authentication system using localStorage for the static HTML version.

function readJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function ensureUserDemoData(user) {
    if (!user || !user.id) {
        return;
    }

    const serversKey = `servers_${user.id}`;
    const ticketsKey = `tickets_${user.id}`;
    const invoicesKey = `invoices_${user.id}`;

    if (!localStorage.getItem(serversKey)) {
        writeJson(serversKey, [
            {
                id: Date.now(),
                name: `${user.username}-mc`,
                type: "minecraft",
                status: "active",
                createdAt: new Date().toISOString()
            }
        ]);
    }

    if (!localStorage.getItem(ticketsKey)) {
        writeJson(ticketsKey, [
            {
                id: Date.now() + 1,
                subject: "Bienvenue chez ZyraHost",
                status: "open",
                priority: "normal",
                createdAt: new Date().toISOString()
            }
        ]);
    }

    if (!localStorage.getItem(invoicesKey)) {
        writeJson(invoicesKey, [
            {
                id: 1001,
                amount: 2.99,
                status: "paid",
                createdAt: new Date().toISOString()
            }
        ]);
    }
}

function initAuth() {
    updateAuthUI();
    checkAuth();
}

function isLoggedIn() {
    return localStorage.getItem("user") !== null;
}

function getCurrentUser() {
    return readJson("user", null);
}

function login(usernameOrEmail, password) {
    const users = readJson("users", []);
    const normalizedValue = usernameOrEmail.trim().toLowerCase();

    const user = users.find((candidate) => {
        return (
            (candidate.username.toLowerCase() === normalizedValue ||
                candidate.email.toLowerCase() === normalizedValue) &&
            candidate.password === password
        );
    });

    if (!user) {
        return {
            success: false,
            message: "Nom d'utilisateur, email ou mot de passe incorrect."
        };
    }

    const sessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
    };

    writeJson("user", sessionUser);
    ensureUserDemoData(sessionUser);

    return { success: true, message: "Connexion réussie !" };
}

function register(username, email, password) {
    const users = readJson("users", []);
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedUsername.length < 3) {
        return {
            success: false,
            message: "Le nom d'utilisateur doit contenir au moins 3 caractères."
        };
    }

    if (password.length < 8) {
        return {
            success: false,
            message: "Le mot de passe doit contenir au moins 8 caractères."
        };
    }

    if (users.find((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase())) {
        return { success: false, message: "Ce nom d'utilisateur est déjà pris." };
    }

    if (users.find((user) => user.email.toLowerCase() === normalizedEmail)) {
        return { success: false, message: "Cet email est déjà utilisé." };
    }

    const newUser = {
        id: Date.now(),
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJson("users", users);
    ensureUserDemoData(newUser);

    return { success: true, message: "Compte créé avec succès !" };
}

function logout() {
    localStorage.removeItem("user");
    updateAuthUI();
    window.location.href = "index.html";
}

function updateAuthUI() {
    const authLinks = document.getElementById("authLinks");
    if (!authLinks) {
        return;
    }

    if (isLoggedIn()) {
        authLinks.innerHTML = `
            <a href="dashboard.html">Dashboard</a>
            <a href="logout.html">Déconnexion</a>
        `;
        return;
    }

    authLinks.innerHTML = `
        <a href="login.html">Connexion</a>
        <a href="register.html">Inscription</a>
    `;
}

function checkAuth() {
    const currentPage = window.location.pathname.split("/").pop();
    const protectedPages = ["dashboard.html"];

    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        window.location.href = "login.html";
    }

    if ((currentPage === "login.html" || currentPage === "register.html") && isLoggedIn()) {
        window.location.href = "dashboard.html";
    }
}

function getUserServers() {
    const user = getCurrentUser();
    if (!user) {
        return [];
    }

    return readJson(`servers_${user.id}`, []);
}

function getUserTickets() {
    const user = getCurrentUser();
    if (!user) {
        return [];
    }

    return readJson(`tickets_${user.id}`, []);
}

function getUserInvoices() {
    const user = getCurrentUser();
    if (!user) {
        return [];
    }

    return readJson(`invoices_${user.id}`, []);
}

document.addEventListener("DOMContentLoaded", initAuth);
