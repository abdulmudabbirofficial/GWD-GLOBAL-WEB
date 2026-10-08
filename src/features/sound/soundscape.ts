import sounds from './sounds.json';

/**
 * The site's sound: one quiet ambient score, composed offline
 * (scripts/sound/compose.py) in four looping layers that every page mixes
 * differently, and a handful of short, soft interface cues. Built the way the
 * reference sites do it (Igloo, Lusion, Unseen): off until the visitor turns
 * it on, low under the page, continuous across pages, and never a jingle.
 *
 *   bed    a warm pad over a D pedal          keys   sparse felt-piano notes
 *   air    soft wind and glass harmonics      pulse  a muffled heartbeat
 *
 *   home       the full, open score; the tone opens as the journey goes on
 *   services   pad and piano, with a faint pulse
 *   products   pad with the pulse forward, the piano sparse
 *   sports     the heartbeat leads and quickens its presence with scroll speed
 *   community  the piano leads, warm and close
 *   about      wind rises as you climb the mountain
 *   contact    near silence; each keystroke is a single soft drop
 *
 * Cues: a tiny tick on hovering anything clickable, a soft tap on press, a
 * breath of air on page change, and a two-note chime when a form is sent.
 * The score steps aside (ducks) while a film plays, and fades out when the
 * tab is hidden.
 */
export type World = 'home' | 'services' | 'service' | 'products' | 'sports' | 'community' | 'about' | 'contact';
type Stem = keyof typeof sounds.stems;
export type Cue = keyof typeof sounds.cues;

const KEY = 'gwd:sound';
const STEMS = Object.keys(sounds.stems) as Stem[];

/** How loud the score sits under the page. */
const VOLUME = 0.32;

const MIX: Record<World, Record<Stem, number>> = {
  home: { bed: 1, keys: 0.7, air: 0.45, pulse: 0 },
  services: { bed: 1, keys: 0.55, air: 0.25, pulse: 0.28 },
  service: { bed: 0.9, keys: 0.45, air: 0.2, pulse: 0.22 },
  products: { bed: 1, keys: 0.35, air: 0.3, pulse: 0.5 },
  sports: { bed: 0.85, keys: 0.25, air: 0.3, pulse: 0.75 },
  community: { bed: 0.95, keys: 0.95, air: 0.25, pulse: 0 },
  about: { bed: 0.9, keys: 0.45, air: 0.55, pulse: 0 },
  contact: { bed: 0.65, keys: 0.25, air: 0.3, pulse: 0 },
};

const CUE: Record<Cue, { level: number; gap: number }> = {
  tick: { level: 0.07, gap: 70 },
  tap: { level: 0.11, gap: 90 },
  swell: { level: 0.2, gap: 700 },
  chime: { level: 0.24, gap: 1200 },
  drop: { level: 0.1, gap: 60 },
};

const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], [role="tab"], summary, label[for], select';

class Soundscape {
  private ctx: AudioContext | null = null;
  /** On/off, ducking and tab visibility. */
  private out: GainNode | null = null;
  /** The score's level, under a tone filter that scroll can open. */
  private music: GainNode | null = null;
  private tone: BiquadFilterNode | null = null;
  private meterNode: AnalyserNode | null = null;
  private meterData: Uint8Array<ArrayBuffer> | null = null;
  private meterAvg: number[] = [];
  private layers = new Map<Stem, GainNode>();
  private started = new Set<Stem>();
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private cues = new Map<Cue, AudioBuffer>();
  private lastCue = new Map<Cue, number>();
  private format: 'webm' | 'm4a' = 'webm';
  private t0 = 0;
  private world: World | null = null;
  private duck = 1;
  private hovered: Element | null = null;
  private progress = 0;
  private velocity = 0;
  private lastY = 0;
  private lastT = 0;
  private frame = 0;
  enabled = false;
  private listeners = new Set<(on: boolean) => void>();

  subscribe(fn: (on: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  wanted() {
    try {
      return localStorage.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  }

  /** Called from a click: the audio graph can only start after a gesture. */
  async enable() {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    await ctx.resume();
    this.enabled = true;
    try {
      localStorage.setItem(KEY, 'on');
    } catch {}
    this.t0 = this.t0 || ctx.currentTime;
    this.applyMix(0.05);
    this.level(1.6);
    this.listeners.forEach((f) => f(true));
    void this.loadCue('tick');
    void this.loadCue('tap');
    void this.loadCue('swell');
  }

  disable() {
    this.enabled = false;
    try {
      localStorage.setItem(KEY, 'off');
    } catch {}
    this.level(0.5);
    window.setTimeout(() => !this.enabled && this.ctx?.suspend(), 900);
    this.listeners.forEach((f) => f(false));
  }

  /** Each page sets its world; the score crossfades to that page's mix. Between pages it simply carries on. */
  setWorld(world: World | null) {
    if (!world || world === this.world) return;
    this.world = world;
    if (this.enabled) this.applyMix(2.4);
  }

  /** Plays a short interface cue, if sound is on. */
  cue(name: Cue, rate = 1) {
    if (!this.ctx || !this.out || !this.enabled || document.visibilityState !== 'visible') return;
    const now = performance.now();
    if (now - (this.lastCue.get(name) ?? 0) < CUE[name].gap) return;
    this.lastCue.set(name, now);
    const buffer = this.cues.get(name);
    if (!buffer) {
      void this.loadCue(name);
      return;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = CUE[name].level;
    src.connect(g);
    g.connect(this.out);
    src.start();
  }

  /**
   * Four bar heights (0–1) for the toggle's meter. An ambient score has a
   * steady spectrum, so each bar shows its band's movement against a slow
   * running average: a piano note or a swell lifts it, the bed alone rests it.
   */
  bands(into: number[]) {
    if (!this.ctx || !this.meterNode || !this.meterData) return into.fill(0);
    this.meterNode.getByteFrequencyData(this.meterData);
    const d = this.meterData;
    const hz = this.ctx.sampleRate / this.meterNode.fftSize;
    const edges = [90, 300, 700, 1400, 3200].map((f) => Math.max(1, Math.round(f / hz)));
    for (let b = 0; b < into.length; b++) {
      let s = 0;
      for (let i = edges[b]!; i < edges[b + 1]!; i++) s += d[i]!;
      const raw = s / Math.max(1, edges[b + 1]! - edges[b]!) / 255;
      const avg = (this.meterAvg[b] = (this.meterAvg[b] ?? raw) * 0.96 + raw * 0.04);
      into[b] = Math.max(0, Math.min(1, 0.3 + (raw - avg) * 7 + raw * 0.25));
    }
    return into;
  }

  /* ── Graph ───────────────────────────────────────────── */

  private build() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    // Phones get a lighter context: the score has nothing above 16 kHz, and decoded loops take a third less memory.
    const light = window.matchMedia('(pointer: coarse)').matches;
    let ctx: AudioContext;
    try {
      ctx = light ? new Ctx({ sampleRate: 32000 }) : new Ctx();
    } catch {
      ctx = new Ctx();
    }
    this.ctx = ctx;
    this.format = new Audio().canPlayType('audio/webm; codecs="opus"') ? 'webm' : 'm4a';

    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(ctx.destination);
    this.meterNode = ctx.createAnalyser();
    this.meterNode.fftSize = 256;
    this.meterNode.smoothingTimeConstant = 0.6;
    this.meterNode.minDecibels = -95;
    this.meterNode.maxDecibels = -35;
    this.meterData = new Uint8Array(new ArrayBuffer(this.meterNode.frequencyBinCount));
    this.out.connect(this.meterNode);

    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 12000;
    this.tone.Q.value = 0.5;
    this.music = ctx.createGain();
    this.music.gain.value = VOLUME;
    this.music.connect(this.tone);
    this.tone.connect(this.out);
    for (const stem of STEMS) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.music);
      this.layers.set(stem, g);
    }

    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    document.addEventListener('pointerover', this.onOver, { passive: true });
    document.addEventListener('pointerdown', this.onDown, { passive: true });
    window.addEventListener('gwd:keystroke', this.onKey);
    window.addEventListener('gwd:media', this.onMedia as EventListener);
  }

  private load(url: string) {
    let p = this.buffers.get(url);
    if (!p) {
      const ctx = this.ctx!;
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null);
      this.buffers.set(url, p);
    }
    return p;
  }

  /** WebM/Opus where the browser decodes it, AAC otherwise (or if decoding fails). */
  private async fetchSound(entry: { webm: string; m4a: string }) {
    const first = await this.load(entry[this.format]);
    if (first || this.format === 'm4a') return first;
    this.format = 'm4a';
    return this.load(entry.m4a);
  }

  private async loadCue(name: Cue) {
    if (!this.ctx || this.cues.has(name)) return;
    const buffer = await this.fetchSound(sounds.cues[name]);
    if (buffer) this.cues.set(name, buffer);
  }

  /** Starts a layer, in step with the others; each loops one exact period from inside its padded file. */
  private async startStem(stem: Stem) {
    if (this.started.has(stem) || !this.ctx) return;
    this.started.add(stem);
    const entry = sounds.stems[stem];
    const buffer = await this.fetchSound(entry);
    const ctx = this.ctx;
    if (!buffer) {
      this.started.delete(stem);
      return;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = sounds.pad / 2;
    src.loopEnd = sounds.pad / 2 + entry.period;
    src.connect(this.layers.get(stem)!);
    const offset = src.loopStart + ((ctx.currentTime - this.t0) % entry.period);
    src.start(ctx.currentTime + 0.02, offset);
  }

  private applyMix(seconds: number) {
    if (!this.ctx) return;
    const mix = MIX[this.world ?? 'home'];
    const t = this.ctx.currentTime;
    for (const stem of STEMS) {
      const target = mix[stem];
      if (target > 0) void this.startStem(stem);
      const g = this.layers.get(stem)!.gain;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(target, t, seconds / 3);
    }
    this.react();
  }

  /** The master level: on/off, ducked under films, silent in a hidden tab. */
  private level(seconds: number) {
    if (!this.ctx || !this.out) return;
    const visible = document.visibilityState === 'visible';
    const to = this.enabled && visible ? this.duck : 0;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(to, t, seconds / 3);
  }

  /* ── Reactions ───────────────────────────────────────── */

  /** Scroll shapes the score gently: tone opens on Home, wind rises on About, the pulse leans in on Sports. */
  private react() {
    if (!this.ctx || !this.enabled || !this.tone) return;
    const t = this.ctx.currentTime;
    const p = this.progress;
    const world = this.world ?? 'home';
    this.tone.frequency.setTargetAtTime(world === 'home' ? 1800 + p * p * 9000 : 12000, t, 0.5);
    if (world === 'about') this.layers.get('air')!.gain.setTargetAtTime(MIX.about.air + p * 0.6, t, 0.6);
    if (world === 'sports') this.layers.get('pulse')!.gain.setTargetAtTime(MIX.sports.pulse + this.velocity * 0.35, t, 0.4);
  }

  private onScroll = () => {
    if (!this.enabled || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(16, now - this.lastT);
      this.velocity = Math.min(1, Math.abs(y - this.lastY) / dt / 3);
      this.lastY = y;
      this.lastT = now;
      this.progress = y / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      this.react();
    });
  };

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.visibilityState === 'visible' && this.enabled) void this.ctx.resume();
    this.level(0.4);
    if (document.visibilityState !== 'visible') window.setTimeout(() => document.visibilityState !== 'visible' && this.ctx?.suspend(), 500);
  };

  private onOver = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !this.enabled) return;
    const el = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
    if (el === this.hovered) return;
    this.hovered = el;
    if (el && !el.closest('[data-silent]')) this.cue('tick');
  };

  private onDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    const el = (e.target as Element | null)?.closest?.(INTERACTIVE);
    if (el && !el.closest('[data-silent]')) this.cue('tap');
  };

  private onKey = () => {
    if (this.world === 'contact') this.cue('drop', 0.9 + Math.random() * 0.25);
  };

  private onMedia = (e: CustomEvent<{ playing: boolean }>) => {
    this.duck = e.detail?.playing ? 0 : 1;
    this.level(0.8);
  };
}

export const soundscape = typeof window !== 'undefined' ? new Soundscape() : null;
