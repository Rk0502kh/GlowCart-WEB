(() => {
  const USERS_KEY = "glowcart-users";
  const SESSION_KEY = "glowcart-session";
  const ADMIN_EMAIL = "admin@glowcart.demo";
  const ADMIN_PASSWORD = "GlowCartAdmin2026!";

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  async function hashPassword(password, email) {
    const input = new TextEncoder().encode(`${email.toLowerCase()}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", input);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function registerCustomer({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readUsers();
    if (users.some(user => user.email === normalizedEmail)) throw new Error("An account already exists for that email.");
    const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, passwordHash: await hashPassword(password, normalizedEmail), role: "customer", active: true, createdAt: new Date().toISOString() };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    signInUser(user);
    return user;
  }

  async function authenticate({ email, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (role === "admin") {
      if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) throw new Error("Those administrator credentials were not recognized.");
      const user = { id: "demo-admin", name: "GlowCart Admin", email: ADMIN_EMAIL, role: "admin" };
      signInUser(user);
      return user;
    }
    const passwordHash = await hashPassword(password, normalizedEmail);
    const user = readUsers().find(entry => entry.email === normalizedEmail && entry.passwordHash === passwordHash && entry.role === "customer" && entry.active !== false);
    if (!user) throw new Error("Email or password is incorrect.");
    signInUser(user);
    return user;
  }

  function signInUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, signedInAt: new Date().toISOString() }));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function signOut() { localStorage.removeItem(SESSION_KEY); }

  window.GlowCartAuth = { authenticate, getSession, registerCustomer, signOut, readUsers, demoAdmin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } };
})();
