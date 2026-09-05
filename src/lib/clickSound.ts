const STORAGE_KEY = "tp.soundEnabled";

let audioCtx: AudioContext | null = null;
let enabled = true;

try {
  enabled = window.localStorage.getItem(STORAGE_KEY) !== "false";
} catch {
  enabled = true;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Speicher nicht verfügbar -> ignorieren
  }
}

function playClick() {
  if (!enabled) return;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as any).webkitAudioContext;
      if (!Ctor) return;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1080, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Audio nicht verfügbar -> still verhalten
  }
}

// Nur beim Wechseln über die Tableiste (TopBar-Tabs) abspielen
export function playTabClick() {
  playClick();
}