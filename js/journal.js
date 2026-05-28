/* ============================================
   journal.js — Daily Intention & Reflection Journal
   Digital Zen · 数字禅
   ============================================ */

const Journal = {
  elements: {
    intentions: null,
    inputs: null,
    reflection: null,
    saveBtn: null,
    indicator: null,
  },

  init() {
    this.elements.intentions = document.getElementById("journal-intentions");
    this.elements.inputs = document.querySelectorAll(".intention-input");
    this.elements.reflection = document.querySelector(".reflection-input");
    this.elements.saveBtn = document.getElementById("btn-save-journal");
    this.elements.indicator = document.getElementById("journal-save-indicator");

    this.loadSaved();
    this.bindEvents();
  },

  bindEvents() {
    this.elements.saveBtn.addEventListener("click", () => this.save());

    // Auto-save on input change (debounced)
    let debounceTimer;
    const autoSave = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.save(true), 1500);
    };

    this.elements.inputs.forEach(input => {
      input.addEventListener("input", autoSave);
    });
    this.elements.reflection.addEventListener("input", autoSave);
  },

  loadSaved() {
    const intentions = Storage.getTodayIntentions();
    this.elements.inputs.forEach((input, i) => {
      input.value = intentions[i] || "";
    });

    const reflection = Storage.getTodayReflection();
    this.elements.reflection.value = reflection;
  },

  save(isAutoSave = false) {
    const intentions = [];
    this.elements.inputs.forEach(input => {
      intentions.push(input.value.trim());
    });
    Storage.saveIntentions(intentions);
    Storage.saveReflection(this.elements.reflection.value.trim());

    this.showIndicator(isAutoSave ? "已自动保存 ✅" : "已保存 ✅");
  },

  showIndicator(msg) {
    this.elements.indicator.textContent = msg;
    this.elements.indicator.classList.add("show");
    clearTimeout(this._indicatorTimeout);
    this._indicatorTimeout = setTimeout(() => {
      this.elements.indicator.classList.remove("show");
    }, 2000);
  },
};
