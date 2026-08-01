// Procedural background music + UI sound effects, generated entirely with the Web Audio
// API — no external audio files to source, license, or host. Shared by both the host
// screen and player consoles, but only the HOST calls updateForState() for the looping
// ambient bed — every phone in the room independently looping the same pad/pulse out of
// sync with each other and the TV speaker would be a mess. Players only get the one-shot
// SFX (playClick/playSuccess/playFail), which is safe for every device to play locally.

const MUTE_KEY = "quiplash:musicMuted";

let ctx = null;
let masterGain = null;
let unlocked = false;
let muted = localStorage.getItem(MUTE_KEY) === "1";

let activeScene = null; // { stop(fadeMs) }
let currentSceneKey = null;
let lastPhase = null;
let tensionTimerId = null;
let currentTimerSnapshot = null; // { startAt, durationMs, serverNow } while the answering clock runs

function ensureContext() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 0.35;
  masterGain.connect(ctx.destination);
}

// Must be called synchronously from inside a real user-gesture handler (click/submit) —
// browsers block audio until one fires. Safe to call repeatedly; only does real work once.
export function unlockAudio() {
  ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  unlocked = true;
}

export function isMuted() {
  return muted;
}

export function setMuted(next) {
  muted = next;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.35, ctx.currentTime + 0.3);
  }
}

function noteEnvelope(freq, { start, duration, peak = 0.18, type = "sine", destination }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + duration * 0.15);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// A slow-breathing pad: detuned oscillators under a shared gain that gently swells via an
// LFO — used for the calm screens (lobby, round-end, final).
function startPad(freqs, { type = "sine", swell = 4 } = {}) {
  const sceneGain = ctx.createGain();
  sceneGain.gain.value = 0;
  sceneGain.connect(masterGain);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 1 / swell;
  lfoGain.gain.value = 0.06;
  lfo.connect(lfoGain);
  lfoGain.connect(sceneGain.gain);
  lfo.start();

  const oscs = freqs.map((f) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = f;
    osc.connect(sceneGain);
    osc.start();
    return osc;
  });

  sceneGain.gain.setTargetAtTime(0.14, ctx.currentTime, 0.6);

  return {
    stop(fadeMs = 800) {
      const t = ctx.currentTime;
      sceneGain.gain.cancelScheduledValues(t);
      sceneGain.gain.setTargetAtTime(0, t, fadeMs / 3000);
      lfo.stop(t + fadeMs / 1000 + 0.5);
      oscs.forEach((o) => o.stop(t + fadeMs / 1000 + 0.5));
    },
  };
}

// A rhythmic pulse cycling through a short note pattern — used for the answering countdown.
// `getBpm` is re-read on every beat so tempo can climb as the clock runs down.
function startPulse(freqs, { getBpm, type = "triangle" } = {}) {
  const sceneGain = ctx.createGain();
  sceneGain.gain.value = 0;
  sceneGain.connect(masterGain);
  sceneGain.gain.setTargetAtTime(0.16, ctx.currentTime, 0.4);

  let stopped = false;
  let i = 0;
  function beat() {
    if (stopped) return;
    const bpm = getBpm();
    const noteDur = 60 / bpm;
    noteEnvelope(freqs[i % freqs.length], {
      start: ctx.currentTime,
      duration: noteDur * 0.85,
      peak: 0.22,
      type,
      destination: sceneGain,
    });
    i += 1;
    tensionTimerId = setTimeout(beat, noteDur * 1000);
  }
  beat();

  return {
    stop(fadeMs = 500) {
      stopped = true;
      clearTimeout(tensionTimerId);
      const t = ctx.currentTime;
      sceneGain.gain.cancelScheduledValues(t);
      sceneGain.gain.setTargetAtTime(0, t, fadeMs / 3000);
    },
  };
}

// A single resolving chord, not looped — for the final results screen.
function playSting(freqs, { type = "sine", duration = 1.6 } = {}) {
  const stingGain = ctx.createGain();
  stingGain.connect(masterGain);
  const t = ctx.currentTime;
  freqs.forEach((f, idx) => {
    noteEnvelope(f, { start: t + idx * 0.04, duration, peak: 0.2, type, destination: stingGain });
  });
}

// Short one-shot UI feedback, safe for every device (host or player) to play locally.
// playClick() is meant to be wired to a single delegated listener covering every button.
export function playClick() {
  if (!unlocked) return;
  ensureContext();
  noteEnvelope(720, { start: ctx.currentTime, duration: 0.06, peak: 0.12, type: "square", destination: masterGain });
}

export function playSuccess() {
  if (!unlocked) return;
  ensureContext();
  const t = ctx.currentTime;
  noteEnvelope(523.25, { start: t, duration: 0.12, peak: 0.18, type: "sine", destination: masterGain });
  noteEnvelope(783.99, { start: t + 0.09, duration: 0.18, peak: 0.18, type: "sine", destination: masterGain });
}

export function playFail() {
  if (!unlocked) return;
  ensureContext();
  const t = ctx.currentTime;
  noteEnvelope(220.0, { start: t, duration: 0.16, peak: 0.16, type: "sawtooth", destination: masterGain });
  noteEnvelope(174.61, { start: t + 0.1, duration: 0.22, peak: 0.16, type: "sawtooth", destination: masterGain });
}

function tensionBpm() {
  if (!currentTimerSnapshot) return 100;
  const { startAt, durationMs, serverNow } = currentTimerSnapshot;
  const remaining = startAt + durationMs - serverNow();
  if (remaining < 15000) return 168;
  if (remaining < 30000) return 136;
  return 100;
}

const SCENES = {
  ambient: () => startPad([164.81, 207.65, 246.94], { type: "triangle", swell: 3 }), // E3-G#3-B3, bright & bouncy
  suspense: () => startPad([123.47, 146.83, 185.0], { type: "triangle", swell: 3 }), // B2-D3-F#3, will-they-win tension
  tension: () => startPulse([329.63, 415.3, 493.88, 659.25], { type: "square", getBpm: tensionBpm }), // E4-G#4-B4-E5, arcade buzzer
};

function sceneKeyForPhase(phase) {
  if (phase === "answering") return "tension";
  if (phase === "voting") return "suspense";
  return "ambient"; // setup, lobby, round-end, final
}

// Called from the same state-subscription that already drives routing/rendering, HOST ONLY.
// Only acts on an actual phase change (not every Firebase snapshot) so it never restarts
// mid-loop.
export function updateForState(state, { serverNow } = {}) {
  if (!unlocked) return;
  ensureContext();

  const activePhase = state.roomId ? state.phase : "setup";

  currentTimerSnapshot =
    activePhase === "answering" && state.public?.timer && serverNow
      ? { ...state.public.timer, serverNow }
      : null;

  if (activePhase === lastPhase) return;
  lastPhase = activePhase;

  if (activePhase === "final") playSting([164.81, 207.65, 246.94, 329.63], { duration: 2.0 }); // E3-G#3-B3-E4

  const sceneKey = sceneKeyForPhase(activePhase);
  if (sceneKey !== currentSceneKey) {
    if (activeScene) activeScene.stop();
    activeScene = SCENES[sceneKey]();
    currentSceneKey = sceneKey;
  }
}
