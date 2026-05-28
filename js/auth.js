/* ============================================
   auth.js — Login, Register, Data Sync
   Digital Zen · 数字禅
   ============================================ */

const Auth = {
  token: null,
  userId: null,
  email: null,
  apiBase: "http://localhost:3456/api",

  init() {
    this.token = localStorage.getItem("dz_token");
    this.userId = localStorage.getItem("dz_userId");
    this.email = localStorage.getItem("dz_email");

    if (this.token) {
      this.validateAndSync();
    }

    this.bindEvents();
  },

  bindEvents() {
    // Login form
    const loginForm = document.getElementById("auth-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        this.login(email, password);
      });
    }

    // Register form
    const regForm = document.getElementById("auth-register-form");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;
        this.register(email, password);
      });
    }

    // Toggle login/register view
    document.querySelectorAll(".auth-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        document.getElementById("auth-login").classList.toggle("hidden");
        document.getElementById("auth-register").classList.toggle("hidden");
        this.clearErrors();
      });
    });

    // Logout
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    // Delete account
    const deleteBtn = document.getElementById("btn-delete-account");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        if (confirm("确定要删除账号吗？云端数据将被永久清除，本地数据不受影响。")) {
          this.deleteAccount();
        }
      });
    }

    // Open auth modal
    const authBtn = document.getElementById("btn-open-auth");
    if (authBtn) {
      authBtn.addEventListener("click", () => {
        document.getElementById("auth-modal").classList.add("open");
      });
    }

    // Close modal
    document.querySelectorAll(".modal-close, .modal-overlay").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target === el) {
          document.getElementById("auth-modal").classList.remove("open");
        }
      });
    });

    // Sync button
    const syncBtn = document.getElementById("btn-sync");
    if (syncBtn) {
      syncBtn.addEventListener("click", () => this.syncNow());
    }
  },

  async login(email, password) {
    this.showError("");
    try {
      const res = await fetch(`${this.apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      this.setSession(data.token, data.userId, email);
      document.getElementById("auth-modal").classList.remove("open");
      this.updateUI();
      await this.loadCloudData();
      App.showToast("登录成功");
    } catch (err) {
      this.showError(err.message);
    }
  },

  async register(email, password) {
    this.showError("");
    try {
      const res = await fetch(`${this.apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      this.setSession(data.token, data.userId, email);
      document.getElementById("auth-modal").classList.remove("open");
      this.updateUI();
      await this.saveCloudData(); // initial save
      App.showToast("注册成功，数据已同步");
    } catch (err) {
      this.showError(err.message);
    }
  },

  setSession(token, userId, email) {
    this.token = token;
    this.userId = userId;
    this.email = email;
    localStorage.setItem("dz_token", token);
    localStorage.setItem("dz_userId", userId);
    localStorage.setItem("dz_email", email);
  },

  logout() {
    this.token = null;
    this.userId = null;
    this.email = null;
    localStorage.removeItem("dz_token");
    localStorage.removeItem("dz_userId");
    localStorage.removeItem("dz_email");
    this.updateUI();
    App.showToast("已退出登录");
  },

  async deleteAccount() {
    try {
      await fetch(`${this.apiBase}/auth/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.token}` },
      });
      this.logout();
      App.showToast("账号已删除");
    } catch (err) {
      App.showToast("删除失败: " + err.message);
    }
  },

  async validateAndSync() {
    try {
      const res = await fetch(`${this.apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) throw new Error("invalid");
      this.updateUI();
      await this.loadCloudData();
    } catch {
      // Token expired or invalid, clear session
      this.token = null;
      this.userId = null;
      localStorage.removeItem("dz_token");
      localStorage.removeItem("dz_userId");
      this.updateUI();
    }
  },

  async saveCloudData() {
    if (!this.token) return;
    const data = {};
    for (const key of Object.values(Storage.KEYS)) {
      const val = localStorage.getItem(key);
      if (val) data[key] = val;
    }
    try {
      await fetch(`${this.apiBase}/sync/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ data }),
      });
    } catch (e) {
      // Silently fail — local data is still safe
    }
  },

  async loadCloudData() {
    if (!this.token) return;
    try {
      const res = await fetch(`${this.apiBase}/sync/load`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      // Merge cloud data into localStorage
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
      // Refresh UI
      if (typeof Journal !== "undefined") Journal.loadSaved();
      if (typeof Stats !== "undefined") Stats.refresh();
    } catch (e) {
      // Silently fail
    }
  },

  async syncNow() {
    if (!this.token) return;
    await this.saveCloudData();
    await this.loadCloudData();
    App.showToast("同步完成");
  },

  updateUI() {
    const loggedIn = !!this.token;
    document.querySelectorAll(".auth-logged-out").forEach(el => {
      el.style.display = loggedIn ? "none" : "";
    });
    document.querySelectorAll(".auth-logged-in").forEach(el => {
      el.style.display = loggedIn ? "" : "none";
    });

    const emailEl = document.getElementById("user-email-display");
    if (emailEl) emailEl.textContent = this.email || "";

    // Update sync button visibility
    const syncBtn = document.getElementById("btn-sync");
    if (syncBtn) syncBtn.style.display = loggedIn ? "" : "none";
  },

  showError(msg) {
    const el = document.querySelector(".auth-error");
    if (el) el.textContent = msg;
  },

  clearErrors() {
    this.showError("");
    document.querySelectorAll(".auth-form input").forEach(i => i.value = "");
  },
};
