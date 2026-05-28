/* ============================================
   app.js — Main Application Controller
   Digital Zen · 数字禅
   ============================================ */

const App = {
  quotes: [
    "「专注是新的超能力。」— Cal Newport",
    "「你关注什么，你就成为什么。」— 一行禅师",
    "「深度工作是人类在数字化时代最后的护城河。」",
    "「少即是多，慢即是快。」",
    "「每一次呼吸都是新的开始。」",
    "「你的注意力是你最宝贵的资产。」",
    "「在信息洪流中保持清醒，本身就是一种修行。」",
    "「做少一点，做好一点。」",
    "「数字世界无边，但你的精力有限。」",
    "「正念不是逃避，而是清醒地面对。」",
  ],

  init() {
    this.bindNavigation();
    this.showRandomQuote();
    this.setupResetButton();

    Timer.init();
    Journal.init();
    Sounds.init();

    document.querySelector('[data-view="stats"]').addEventListener("click", () => {
      Stats.refresh();
    });
  },

  bindNavigation() {
    const navBtns = document.querySelectorAll(".nav-btn");
    const views = document.querySelectorAll(".view");

    navBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetView = btn.dataset.view;

        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        views.forEach(v => v.classList.remove("active"));
        const viewEl = document.getElementById("view-" + targetView);
        if (viewEl) viewEl.classList.add("active");

        if (targetView === "stats") Stats.refresh();

        document.title = "Digital Zen";
      });
    });
  },

  showRandomQuote() {
    const quoteEl = document.getElementById("daily-quote");
    quoteEl.textContent = this.quotes[Math.floor(Math.random() * this.quotes.length)];
  },

  setupResetButton() {
    const resetBtn = document.getElementById("btn-reset-stats");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => Stats.resetAll());
    }
  },

  showToast(message, duration = 2500) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
