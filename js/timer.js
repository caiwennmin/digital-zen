/* ============================================
   timer.js — Pomodoro Focus Timer
   Digital Zen · 数字禅
   ============================================ */

const Timer = {
  duration: 25 * 60,
  remaining: 25 * 60,
  totalDuration: 25 * 60,
  mode: "focus",
  isRunning: false,
  intervalId: null,

  elements: {},

  init() {
    this.elements.minutes = document.getElementById("timer-minutes");
    this.elements.seconds = document.getElementById("timer-seconds");
    this.elements.ring = document.querySelector(".ring-progress");
    this.elements.toggleBtn = document.getElementById("btn-timer-toggle");
    this.elements.resetBtn = document.getElementById("btn-timer-reset");
    this.elements.modeBtns = document.querySelectorAll(".mode-btn");
    this.elements.timerDisplay = document.querySelector(".timer-display");

    const settings = Storage.loadSettings();
    if (settings.lastMode && settings.lastDuration) {
      this.mode = settings.lastMode;
      this.duration = settings.lastDuration;
      this.totalDuration = settings.lastDuration;
      this.remaining = settings.lastDuration;
    }

    this.bindEvents();
    this.updateDisplay();
    this.updateRing();
    this.highlightActiveMode();
  },

  bindEvents() {
    this.elements.toggleBtn.addEventListener("click", () => this.toggle());
    this.elements.resetBtn.addEventListener("click", () => this.reset());

    this.elements.modeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.isRunning) return;
        const mode = btn.dataset.mode;
        const duration = parseInt(btn.dataset.duration) * 60;
        this.setMode(mode, duration);
      });
    });
  },

  setMode(mode, duration) {
    this.mode = mode;
    this.totalDuration = duration;
    this.remaining = duration;
    this.isRunning = false;
    clearInterval(this.intervalId);

    Storage.saveSettings({ lastMode: mode, lastDuration: duration });
    this.updateDisplay();
    this.updateRing();
    this.highlightActiveMode();
    this.updateToggleButton();
    this.updateRingColor();
  },

  toggle() {
    this.isRunning ? this.pause() : this.start();
  },

  start() {
    this.isRunning = true;
    this.updateToggleButton();

    this.intervalId = setInterval(() => {
      this.remaining--;
      this.updateDisplay();
      this.updateRing();

      if (this.remaining <= 0) this.complete();
    }, 1000);
  },

  pause() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.updateToggleButton();
  },

  reset() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.remaining = this.totalDuration;
    this.updateDisplay();
    this.updateRing();
    this.updateToggleButton();
  },

  complete() {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.remaining = 0;
    this.updateDisplay();
    this.updateRing();

    const completedMinutes = Math.floor(this.totalDuration / 60);
    Storage.addSession(completedMinutes, this.mode);

    this.elements.timerDisplay.classList.add("timer-complete");
    setTimeout(() => {
      this.elements.timerDisplay.classList.remove("timer-complete");
    }, 1800);

    App.showToast(this.getCompletionMessage());

    if (typeof Stats !== "undefined") Stats.refresh();
    if (typeof Auth !== "undefined") Auth.saveCloudData();

    setTimeout(() => {
      this.remaining = this.totalDuration;
      this.updateDisplay();
      this.updateRing();
      this.updateToggleButton();
    }, 2000);
  },

  getCompletionMessage() {
    switch (this.mode) {
      case "focus": return "专注完成，休息一下吧";
      case "shortBreak": return "休息结束，准备下一轮";
      case "longBreak": return "长休结束，精力满满";
      default: return "计时完成";
    }
  },

  updateDisplay() {
    const mins = Math.floor(this.remaining / 60);
    const secs = this.remaining % 60;
    this.elements.minutes.textContent = String(mins).padStart(2, "0");
    this.elements.seconds.textContent = String(secs).padStart(2, "0");
    document.title = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} · Digital Zen`;
  },

  updateRing() {
    const circumference = 2 * Math.PI * 90;
    const progress = 1 - (this.remaining / this.totalDuration);
    const offset = circumference * (1 - progress);
    this.elements.ring.style.strokeDasharray = circumference;
    this.elements.ring.style.strokeDashoffset = offset;
  },

  updateRingColor() {
    this.elements.ring.classList.toggle("break", this.mode !== "focus");
  },

  updateToggleButton() {
    const labels = { focus: "专注", shortBreak: "小憩", longBreak: "长休" };
    if (this.isRunning) {
      this.elements.toggleBtn.textContent = "暂停";
    } else {
      this.elements.toggleBtn.textContent = `开始${labels[this.mode] || ""}`;
    }
  },

  highlightActiveMode() {
    this.elements.modeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === this.mode);
    });
    this.updateRingColor();
  },
};
