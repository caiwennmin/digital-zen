/* ============================================
   storage.js — localStorage wrapper
   Digital Zen · 数字禅
   ============================================ */

const Storage = {
  KEYS: {
    INTENTIONS: "dz_intentions",
    REFLECTION: "dz_reflection",
    SESSIONS: "dz_sessions",
    SETTINGS: "dz_settings",
    STREAK: "dz_streak",
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
  },

  load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Storage load failed:", e);
      return fallback;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },

  /* Session tracking */
  addSession(durationMinutes, mode) {
    const sessions = this.load(this.KEYS.SESSIONS, []);
    sessions.push({
      date: new Date().toISOString(),
      duration: durationMinutes,
      mode: mode,
    });
    // Keep last 365 days of sessions
    while (sessions.length > 5000) sessions.shift();
    this.save(this.KEYS.SESSIONS, sessions);
    this.updateStreak();
  },

  getSessions() {
    return this.load(this.KEYS.SESSIONS, []);
  },

  getTodaySessions() {
    const today = new Date().toDateString();
    return this.getSessions().filter(s =>
      new Date(s.date).toDateString() === today
    );
  },

  getWeekSessions() {
    const sessions = this.getSessions();
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return sessions.filter(s => new Date(s.date) >= weekAgo);
  },

  getTotalFocusMinutes() {
    return this.getSessions()
      .filter(s => s.mode === "focus")
      .reduce((sum, s) => sum + s.duration, 0);
  },

  /* Streak tracking */
  updateStreak() {
    const sessions = this.getSessions();
    if (sessions.length === 0) {
      this.save(this.KEYS.STREAK, { count: 0, lastDate: null });
      return;
    }
    const streak = this.load(this.KEYS.STREAK, { count: 0, lastDate: null });
    const today = new Date().toDateString();

    if (streak.lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (streak.lastDate === yesterdayStr) {
      streak.count += 1;
    } else if (streak.lastDate !== today) {
      streak.count = 1;
    }
    streak.lastDate = today;
    this.save(this.KEYS.STREAK, streak);
  },

  getStreak() {
    const streak = this.load(this.KEYS.STREAK, { count: 0, lastDate: null });
    // Check if streak is still valid (today or yesterday)
    if (!streak.lastDate) return 0;
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (streak.lastDate === today || streak.lastDate === yesterday.toDateString()) {
      return streak.count;
    }
    return 0;
  },

  /* Journal */
  saveIntentions(intentions) {
    this.save(this.KEYS.INTENTIONS, {
      date: new Date().toDateString(),
      items: intentions,
    });
  },

  getTodayIntentions() {
    const data = this.load(this.KEYS.INTENTIONS, null);
    if (data && data.date === new Date().toDateString()) {
      return data.items;
    }
    return ["", "", ""];
  },

  saveReflection(text) {
    this.save(this.KEYS.REFLECTION, {
      date: new Date().toDateString(),
      text: text,
    });
  },

  getTodayReflection() {
    const data = this.load(this.KEYS.REFLECTION, null);
    if (data && data.date === new Date().toDateString()) {
      return data.text;
    }
    return "";
  },

  getJournalEntryCount() {
    let count = 0;
    const intentions = this.load(this.KEYS.INTENTIONS, null);
    if (intentions && intentions.items.some(i => i.trim())) count++;
    const reflection = this.load(this.KEYS.REFLECTION, null);
    if (reflection && reflection.text.trim()) count++;
    return count;
  },

  /* Settings */
  saveSettings(settings) {
    this.save(this.KEYS.SETTINGS, { ...this.loadSettings(), ...settings });
  },

  loadSettings() {
    return this.load(this.KEYS.SETTINGS, { sound: "none", volume: 0.5 });
  },
};
