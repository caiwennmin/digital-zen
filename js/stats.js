/* ============================================
   stats.js — Statistics & Progress Dashboard
   Digital Zen · 数字禅
   ============================================ */

const Stats = {
  refresh() {
    this.updateCounters();
    this.renderWeeklyChart();
  },

  updateCounters() {
    const sessions = Storage.getSessions();
    const focusSessions = sessions.filter(s => s.mode === "focus");

    document.getElementById("stat-total-sessions").textContent = focusSessions.length;
    document.getElementById("stat-total-minutes").textContent =
      Storage.getTotalFocusMinutes();
    document.getElementById("stat-streak").textContent = Storage.getStreak();
    document.getElementById("stat-journal-entries").textContent =
      Storage.getJournalEntryCount();
  },

  renderWeeklyChart() {
    const weekSessions = Storage.getWeekSessions();
    const container = document.getElementById("chart-bars");
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const now = new Date();

    // Build map: date string -> total focus minutes
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dailyMap[d.toDateString()] = 0;
    }

    weekSessions.forEach(s => {
      const dateStr = new Date(s.date).toDateString();
      if (dateStr in dailyMap && s.mode === "focus") {
        dailyMap[dateStr] += s.duration;
      }
    });

    const values = Object.values(dailyMap);
    const maxVal = Math.max(...values, 1);

    container.innerHTML = "";
    Object.entries(dailyMap).forEach(([dateStr, minutes], i) => {
      const dayIndex = new Date(dateStr).getDay();
      const heightPercent = Math.max((minutes / maxVal) * 100, 4);

      const wrapper = document.createElement("div");
      wrapper.className = "chart-bar-wrapper";

      const bar = document.createElement("div");
      bar.className = "chart-bar";
      bar.style.height = heightPercent + "%";
      bar.title = `${minutes} 分钟`;

      const label = document.createElement("span");
      label.className = "chart-label";
      label.textContent = days[dayIndex];

      wrapper.appendChild(bar);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  },

  resetAll() {
    if (confirm("确定要删除所有数据吗？此操作不可恢复。")) {
      Storage.clearAll();
      this.refresh();
      App.showToast("🗑 所有数据已清除");
    }
  },
};
