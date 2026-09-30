const form = document.querySelector("#auth-form");
    const roleButtons = [...document.querySelectorAll("[data-role]")];
    const params = new URLSearchParams(location.search);
    let role = params.get("role") === "admin" ? "admin" : "customer";
    let registering = params.get("mode") === "register" && role === "customer";
    function destination(user) {
      if (user.role === "admin") return "admin.html";
      return params.get("return") === "checkout" ? "index.html?checkout=1" : "index.html";
    }
    const existingSession = window.GlowCartAuth.getSession();
    if (existingSession?.role === "admin") location.replace("admin.html");
    else if (existingSession?.role === "customer" && role === "customer" && params.get("return") !== "checkout") location.replace("index.html");
    function showMessage(text, success = false) {
      const message = document.querySelector("#form-message");
      message.textContent = text;
      message.classList.toggle("success", success);
      message.classList.add("show");
    }
    function renderRole() {
      const admin = role === "admin";
      roleButtons.forEach(button => {
        const active = button.dataset.role === role;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      if (admin) registering = false;
      document.querySelector("#name-field").hidden = !registering;
      document.querySelector("#name").required = registering;
      document.querySelector("#form-title").textContent = registering ? "Let's make this your place." : admin ? "Administrator sign in." : "Welcome back.";
      document.querySelector("#form-intro").textContent = admin ? "Sign in with your GlowCart administrator account." : registering ? "Create your customer account to save favorites and orders." : "Sign in to keep your favorites and orders together.";
      document.querySelector("#submit-button").textContent = registering ? "Create customer account" : `Sign in as ${admin ? "administrator" : "customer"}`;
      document.querySelector("#register-switch").hidden = admin;
      document.querySelector("#admin-demo").hidden = !admin;
      document.querySelector("#form-message").classList.remove("show");
    }
    roleButtons.forEach(button => button.addEventListener("click", () => { role = button.dataset.role; registering = false; renderRole(); }));
    document.querySelector("#toggle-register").addEventListener("click", () => { registering = !registering; renderRole(); });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const email = document.querySelector("#email").value;
      const password = document.querySelector("#password").value;
      try {
        const user = registering
          ? await window.GlowCartAuth.registerCustomer({ name: document.querySelector("#name").value, email, password })
          : await window.GlowCartAuth.authenticate({ email, password, role });
        showMessage(registering ? "Your customer account is ready. Taking you to the shop…" : "Signed in. Taking you to your GlowCart workspace…", true);
        setTimeout(() => location.assign(destination(user)), 350);
      } catch (error) {
        showMessage(error.message || "We could not complete that request.");
      }
    });
    renderRole();
