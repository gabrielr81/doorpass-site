// DoorPass hero: an opt-in, original house beat made live with the Web Audio API (no audio file, no autoplay).
// 120 BPM; the crowd and DJ animations are re-timed to land on the beat when the sound starts.
(() => {
  const btn = document.getElementById('hero-sound');
  if (!btn) return;
  if (!(window.AudioContext || window.webkitAudioContext)) { btn.hidden = true; return; }
  const BEAT = 0.5;            // seconds per beat (120 BPM); matches the CSS animation lengths
  const STEP = BEAT / 4;       // 16th notes
  const ROOTS = [55, 43.65, 65.41, 49];                              // A1 F1 C2 G1, one per bar
  const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]; // Am F C G
  let ctx, master, noise, timer, nextTime, step;

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain(); master.gain.value = 0.55;
    master.connect(comp).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function env(t, peak, decay) { const g = ctx.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay); g.connect(master); return g; }
  function kick(t) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); o.connect(env(t, 1, 0.35)); o.start(t); o.stop(t + 0.4); }
  function hiss(t, type, freq, peak, decay) { const s = ctx.createBufferSource(); s.buffer = noise; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; s.connect(f).connect(env(t, peak, decay)); s.start(t); s.stop(t + decay + 0.05); }
  function bass(t, f) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; o.connect(lp).connect(env(t, 0.32, 0.22)); o.start(t); o.stop(t + 0.25); }
  function stab(t, notes) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.18); lp.connect(env(t, 0.09, 0.2)); for (const f of notes) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 0.22); } }

  function schedule(s, t) {
    const inBar = s % 16, bar = Math.floor(s / 16) % 4;
    if (inBar % 4 === 0) kick(t);                                    // four on the floor
    if (inBar === 4 || inBar === 12) hiss(t, 'bandpass', 1500, 0.4, 0.14);   // clap on 2 and 4
    if (inBar % 4 === 2) { hiss(t, 'highpass', 8000, 0.16, 0.06); bass(t, ROOTS[bar]); }   // offbeat hat + bass
    else hiss(t, 'highpass', 9000, 0.04, 0.03);
    if (inBar === 2 || inBar === 10 || inBar === 7) stab(t, CHORDS[bar]);
  }
  function tick() { while (nextTime < ctx.currentTime + 0.12) { schedule(step, nextTime); nextTime += STEP; step++; } }

  function syncDancers(audioStart) {
    // Line every crowd and DJ animation up so their beat-zero lands on the first kick drum.
    const latency = (ctx.outputLatency || ctx.baseLatency || 0);
    const t0 = document.timeline.currentTime + (audioStart - ctx.currentTime + latency) * 1000;
    const venue = document.querySelector('.venue');
    if (venue && venue.getAnimations) for (const a of venue.getAnimations({ subtree: true })) a.startTime = t0;
  }
  async function start() {
    if (!ctx) setup();
    await ctx.resume();
    step = 0; nextTime = ctx.currentTime + 0.15;
    syncDancers(nextTime);
    tick(); timer = setInterval(tick, 25);
    btn.setAttribute('aria-pressed', 'true'); btn.lastElementChild.textContent = 'Sound off';
  }
  function stop() {
    clearInterval(timer); timer = null;
    if (ctx) ctx.suspend();
    btn.setAttribute('aria-pressed', 'false'); btn.lastElementChild.textContent = 'Sound on';
  }
  btn.addEventListener('click', () => (timer ? stop() : start()));
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer) stop(); });
})();
