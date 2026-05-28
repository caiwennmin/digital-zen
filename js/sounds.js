/* ============================================
   sounds.js — Ambient Sound Generator
   Digital Zen · 数字禅
   Uses Web Audio API to generate soothing ambient sounds
   ============================================ */

const Sounds = {
  audioCtx: null,
  activeSound: "none",
  gainNode: null,
  sourceNodes: [],
  isPlaying: false,
  noiseBuffer: null,

  init() {
    this.activeSound = Storage.loadSettings().sound || "none";
    this.bindEvents();
    if (this.activeSound !== "none") {
      this.play(this.activeSound);
    }
    this.highlightActive();
  },

  bindEvents() {
    document.querySelectorAll(".sound-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const sound = btn.dataset.sound;
        if (sound === this.activeSound) {
          this.stop();
        } else {
          this.play(sound);
        }
        Storage.saveSettings({ sound: this.activeSound });
      });
    });
  },

  ensureContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 0.15;
      this.gainNode.connect(this.audioCtx.destination);
    }
  },

  play(sound) {
    this.stop();
    this.ensureContext();
    this.activeSound = sound;
    this.isPlaying = true;

    switch (sound) {
      case "rain": this.createRain(); break;
      case "forest": this.createForest(); break;
      case "cafe": this.createCafe(); break;
      default: this.activeSound = "none"; this.isPlaying = false;
    }

    this.highlightActive();
  },

  stop() {
    this.sourceNodes.forEach(src => {
      try { src.stop(); } catch (e) { /* already stopped */ }
    });
    this.sourceNodes = [];
    this.activeSound = "none";
    this.isPlaying = false;
    this.highlightActive();
  },

  highlightActive() {
    document.querySelectorAll(".sound-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sound === this.activeSound);
    });
  },

  /* ---- Sound generators using Web Audio API ---- */

  createNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 4;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  createRain() {
    // Rain = filtered white noise with gentle modulation
    const buffer = this.createNoiseBuffer();
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    source.connect(filter);
    filter.connect(this.gainNode);
    source.start();

    this.sourceNodes.push(source, lfo);
  },

  createForest() {
    // Forest = filtered noise + intermittent chirps
    const buffer = this.createNoiseBuffer();
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000;
    filter.Q.value = 0.3;

    source.connect(filter);
    filter.connect(this.gainNode);
    source.start();
    this.sourceNodes.push(source);

    // Bird chirps (simple sine oscillator triggered randomly)
    this._forestChirpInterval = setInterval(() => {
      if (this.activeSound !== "forest") {
        clearInterval(this._forestChirpInterval);
        return;
      }
      if (Math.random() > 0.4) this.createChirp();
    }, 3000);
  },

  createChirp() {
    const osc = this.audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2000 + Math.random() * 2000, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      3000 + Math.random() * 1500,
      this.audioCtx.currentTime + 0.1
    );

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
    this.sourceNodes.push(osc);
  },

  createCafe() {
    // Cafe = low filtered noise + subtle tonal hum
    const buffer = this.createNoiseBuffer();
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.Q.value = 0.4;

    source.connect(filter);
    filter.connect(this.gainNode);
    source.start();
    this.sourceNodes.push(source);

    // Subtle hum
    const hum = this.audioCtx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 120;
    const humGain = this.audioCtx.createGain();
    humGain.gain.value = 0.04;
    hum.connect(humGain);
    humGain.connect(this.gainNode);
    hum.start();
    this.sourceNodes.push(hum);
  },
};
