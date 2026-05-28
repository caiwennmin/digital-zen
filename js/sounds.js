/* ============================================
   sounds.js — Ambient Sound Generator
   Digital Zen
   Uses Web Audio API: zero downloads, works offline
   ============================================ */

const Sounds = {
  audioCtx: null,
  activeSound: "none",
  gainNode: null,
  sourceNodes: [],
  intervals: [],
  isPlaying: false,

  init() {
    this.activeSound = Storage.loadSettings().sound || "none";
    this.bindEvents();
    if (this.activeSound !== "none") this.play(this.activeSound);
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
      this.gainNode.gain.value = 0.18;
      this.gainNode.connect(this.audioCtx.destination);
    }
  },

  play(sound) {
    this.stop();
    this.ensureContext();
    this.activeSound = sound;
    this.isPlaying = true;

    switch (sound) {
      case "rain":       this.createRain(); break;
      case "thunder":    this.createThunder(); break;
      case "ocean":      this.createOcean(); break;
      case "wind":       this.createWind(); break;
      case "forest":     this.createForest(); break;
      case "fireplace":  this.createFireplace(); break;
      case "cafe":       this.createCafe(); break;
      case "whitenoise": this.createWhiteNoise(); break;
      case "bowl":       this.createBowl(); break;
      default: this.activeSound = "none"; this.isPlaying = false;
    }

    this.highlightActive();
  },

  stop() {
    this.sourceNodes.forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    this.intervals.forEach(id => clearInterval(id));
    this.sourceNodes = [];
    this.intervals = [];
    this.activeSound = "none";
    this.isPlaying = false;
    this.highlightActive();
  },

  highlightActive() {
    document.querySelectorAll(".sound-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sound === this.activeSound);
    });
  },

  /* ---- Helpers ---- */

  createNoiseBuffer(duration = 4) {
    const size = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, size, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  },

  loopNoise(into, filterFreq, filterType = "lowpass", filterQ = 0.5) {
    const buf = this.createNoiseBuffer();
    const src = this.audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    src.connect(filter);
    filter.connect(into || this.gainNode);
    src.start();
    this.sourceNodes.push(src);
    return { src, filter };
  },

  /* ---- Sound Profiles ---- */

  createRain() {
    const { filter } = this.loopNoise(this.gainNode, 900, "lowpass", 0.4);

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.sourceNodes.push(lfo);
  },

  createThunder() {
    // Base rain layer
    this.createRain();

    // Occasional thunder rumble
    const triggerThunder = () => {
      if (this.activeSound !== "thunder") return;
      if (Math.random() < 0.3) {
        const osc = this.audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 1.5);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(this.gainNode);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 3);
        this.sourceNodes.push(osc);
      }
    };

    const id = setInterval(triggerThunder, 6000);
    this.intervals.push(id);
    triggerThunder();
  },

  createOcean() {
    // Slow-modulated low noise = waves
    const { filter } = this.loopNoise(this.gainNode, 400, "lowpass", 0.3);

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.08; // very slow wave rhythm
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.sourceNodes.push(lfo);

    // Add a subtle gain modulation for wave "swell"
    const lfo2 = this.audioCtx.createOscillator();
    lfo2.frequency.value = 0.06;
    const lfo2Gain = this.audioCtx.createGain();
    lfo2Gain.gain.value = 0.06;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(this.gainNode.gain);
    lfo2.start();
    this.sourceNodes.push(lfo2);
  },

  createWind() {
    const { filter } = this.loopNoise(this.gainNode, 600, "bandpass", 0.2);

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.sourceNodes.push(lfo);

    // Gain swell for gusts
    const lfo2 = this.audioCtx.createOscillator();
    lfo2.frequency.value = 0.05;
    const lfo2Gain = this.audioCtx.createGain();
    lfo2Gain.gain.value = 0.05;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(this.gainNode.gain);
    lfo2.start();
    this.sourceNodes.push(lfo2);
  },

  createForest() {
    // Base ambient
    this.loopNoise(this.gainNode, 1800, "bandpass", 0.25);

    // Bird chirps
    const chirp = () => {
      if (this.activeSound !== "forest") return;
      if (Math.random() > 0.45) {
        const osc = this.audioCtx.createOscillator();
        osc.type = "sine";
        const freq = 2000 + Math.random() * 2200;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq + 1200, this.audioCtx.currentTime + 0.08);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, this.audioCtx.currentTime + 0.04);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(this.gainNode);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
        this.sourceNodes.push(osc);
      }
    };
    const id = setInterval(chirp, 2500);
    this.intervals.push(id);
  },

  createFireplace() {
    // Crackling = high-frequency noise bursts with envelope
    this.loopNoise(this.gainNode, 300, "lowpass", 0.5);

    const crackle = () => {
      if (this.activeSound !== "fireplace") return;
      const count = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const osc = this.audioCtx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 400 + Math.random() * 800;

        const gain = this.audioCtx.createGain();
        const t = this.audioCtx.currentTime + Math.random() * 0.3;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.04, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + Math.random() * 0.12);

        osc.connect(gain);
        gain.connect(this.gainNode);
        osc.start(t);
        osc.stop(t + 0.2);
        this.sourceNodes.push(osc);
      }
    };
    const id = setInterval(crackle, 200);
    this.intervals.push(id);
  },

  createCafe() {
    this.loopNoise(this.gainNode, 500, "lowpass", 0.4);

    // Subtle background hum
    const hum = this.audioCtx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 110;
    const humGain = this.audioCtx.createGain();
    humGain.gain.value = 0.04;
    hum.connect(humGain);
    humGain.connect(this.gainNode);
    hum.start();
    this.sourceNodes.push(hum);

    // Occasional clink / murmur burst
    const murmur = () => {
      if (this.activeSound !== "cafe") return;
      if (Math.random() > 0.6) {
        const buf = this.createNoiseBuffer(0.5);
        const src = this.audioCtx.createBufferSource();
        src.buffer = buf;

        const bp = this.audioCtx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1500 + Math.random() * 2000;
        bp.Q.value = 0.8;

        const g = this.audioCtx.createGain();
        g.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

        src.connect(bp);
        bp.connect(g);
        g.connect(this.gainNode);
        src.start();
        src.stop(this.audioCtx.currentTime + 0.5);
        this.sourceNodes.push(src);
      }
    };
    const id = setInterval(murmur, 4000);
    this.intervals.push(id);
  },

  createWhiteNoise() {
    this.loopNoise(this.gainNode, 8000, "lowpass", 0.1);
  },

  createBowl() {
    // Tibetan singing bowl — slow-decaying bell-like tones
    const playBowlNote = (freq, delay) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = this.audioCtx.createGain();
      const t = this.audioCtx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 6);

      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start(t);
      osc.stop(t + 7);
      this.sourceNodes.push(osc);
    };

    // Fundamental + harmonics
    playBowlNote(220, 0);
    playBowlNote(440, 0.1);
    playBowlNote(554, 0.15);
    playBowlNote(880, 0.2);

    // Repeat every 12 seconds
    const repeat = () => {
      if (this.activeSound !== "bowl") return;
      playBowlNote(220, 0);
      playBowlNote(440, 0.1);
      playBowlNote(554, 0.15);
      playBowlNote(880, 0.2);
    };
    const id = setInterval(repeat, 12000);
    this.intervals.push(id);
  },
};
