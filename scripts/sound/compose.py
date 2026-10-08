"""
Composes the site's sound offline: a quiet ambient score in four layers
(stems) and five short interface cues, written as Opus/WebM with an AAC
fallback and content-hashed like every other media file.

  bed    a warm pad over a D pedal (D, G/D, Bm/D, A/D), breathing slowly
  keys   sparse felt-piano notes from D major pentatonic
  air    soft wind and faint glass harmonics
  pulse  a muffled heartbeat with a light brush, for the pages that move

  tick   hover          tap    press          swell  page change
  chime  form sent      drop   keystroke (contact)

The approach follows the reference sites (Igloo, Lusion, Unseen): sound off
until asked for, one continuous bed mixed from stems per scene, and interface
cues that are short, high and very quiet.

Every stem is exactly periodic: tones sit on the loop's frequency grid, noise
is built in the frequency domain, notes and reverb tails wrap around. Each
file carries PAD seconds of circular padding at both ends, so the browser can
loop any window of exactly one period without a seam, whatever the encoder
adds at the start.

  python scripts/sound/compose.py
"""

import hashlib
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 48000
PAD = 1.0
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'media' / 'sound'
MANIFEST = ROOT / 'src' / 'features' / 'sound' / 'sounds.json'
rng = np.random.default_rng(11)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def grid(f, period):
    """The nearest frequency that completes whole cycles in one loop."""
    return max(1, round(f * period)) / period


def spectral(x, gain):
    """Filter a periodic signal exactly, by a gain curve over frequency."""
    n = x.shape[-1]
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(np.fft.rfft(x, axis=-1) * gain(f), n, axis=-1)


def lowpass(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def highpass(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))


def impulse(seconds, predelay=0.02, bright=1.0, seed=0):
    """A stereo room: early reflections, then a tail that darkens as it decays."""
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = np.fft.rfftfreq(n, 1 / SR)
    out = np.zeros((2, n))
    bands = [(0, 600, 1.0), (600, 3000, 0.7), (3000, 12000, 0.38 * bright)]
    for ch in range(2):
        tail = np.zeros(n)
        for lo, hi, k in bands:
            spec = np.fft.rfft(r.standard_normal(n))
            mask = 1 / (1 + np.exp(-(f - lo) / (lo * 0.15 + 30))) * (1 / (1 + np.exp((f - hi) / (hi * 0.15))))
            band = np.fft.irfft(spec * mask, n)
            tail += band * np.exp(-6.9 * t / (seconds * k))
        tail *= 1 - np.exp(-t / 0.012)
        er = np.zeros(n)
        for d, g in [(0.007, 0.5), (0.013, 0.38), (0.021, 0.3), (0.029, 0.22), (0.041, 0.16)]:
            i = int((d + r.uniform(-0.002, 0.002)) * SR)
            er[i] += g * r.choice([-1, 1])
        ir = er * 0.6 + tail / np.sqrt(np.sum(tail**2)) * 4
        shift = int(predelay * SR)
        out[ch, shift:] = ir[: n - shift]
    return out / np.max(np.abs(out))


def reverb_loop(x, ir, wet, dry=1.0):
    """Circular convolution: the tail of the loop's end rings into its start."""
    n = x.shape[-1]
    mono = x.mean(axis=0)
    X = np.fft.rfft(mono)
    w = np.stack([np.fft.irfft(X * np.fft.rfft(ir[c], n), n) for c in range(2)])
    w *= np.sqrt(np.mean(mono**2)) / (np.sqrt(np.mean(w**2)) + 1e-12)
    return x * dry + w * wet


def reverb_once(x, ir, wet, dry=1.0):
    n = x.shape[-1] + ir.shape[-1]
    mono = x.mean(axis=0)
    X = np.fft.rfft(mono, n)
    w = np.stack([np.fft.irfft(X * np.fft.rfft(ir[c], n), n) for c in range(2)])
    w *= np.sqrt(np.mean(mono**2)) / (np.sqrt(np.mean(w[:, : x.shape[-1]] ** 2)) + 1e-12)
    out = w * wet
    out[:, : x.shape[-1]] += x * dry
    return out


def smooth_loop(env, seconds):
    """Soften a periodic envelope with a Hann window (circularly)."""
    n = env.shape[-1]
    k = int(seconds * SR)
    win = np.zeros(n)
    win[:k] = np.hanning(k)
    win = np.roll(win, -k // 2)
    win /= win.sum()
    return np.fft.irfft(np.fft.rfft(env) * np.fft.rfft(win), n)


def pan(sig, p):
    """Equal-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)])


def piano(freq, seconds, vel=0.7, damp=1.0, seed=0):
    """A felt-damped piano note: slightly inharmonic, two strings, soft hammer."""
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 12):
        fk = k * freq * np.sqrt(1 + 0.00025 * k * k)
        if fk > 9000:
            break
        a = k**-1.25 * np.exp(-(k - 1) * (0.62 - 0.3 * vel))
        t1 = 0.55 / (1 + 0.35 * (k - 1)) * damp
        t2 = 4.8 / (1 + 0.45 * (k - 1)) * damp
        env = 0.68 * np.exp(-t / t1) + 0.32 * np.exp(-t / t2)
        for cents in (-0.9, 0.9):
            ph = r.uniform(0, 2 * np.pi)
            out += a * env * np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * t + ph) * 0.5
    out *= 1 - np.exp(-t / 0.0045)
    thump = r.standard_normal(n) * np.exp(-t / 0.006) * 0.05 * vel
    out += np.fft.irfft(np.fft.rfft(thump) * lowpass(500)(np.fft.rfftfreq(n, 1 / SR)), n)
    fade = np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    return out * fade * vel


def place(buf, sig, at):
    """Add a stereo signal into a periodic buffer, wrapping at the end."""
    n = buf.shape[-1]
    idx = (np.arange(sig.shape[-1]) + int(at * SR)) % n
    np.add.at(buf, (slice(None), idx), sig)


def level(x, rms_db=-20.0, ceiling=0.94):
    x = x * (10 ** (rms_db / 20) / (np.sqrt(np.mean(x**2)) + 1e-12))
    return ceiling * np.tanh(x / ceiling)


# ── Stems ──────────────────────────────────────────────────────────────


def bed(period=32):
    n = period * SR
    t = np.arange(n) / SR
    chords = [
        [38, 45, 50, 54, 57, 64],  # D add9
        [38, 43, 50, 55, 59, 66],  # G maj7 over D
        [38, 47, 50, 54, 59, 62],  # B minor over D
        [38, 45, 52, 57, 59, 64],  # A sus2 over D
    ]
    seg = period / len(chords)
    pitches = sorted({p for c in chords for p in c})
    out = np.zeros((2, n))
    for p in pitches:
        presence = np.zeros(n)
        for i, c in enumerate(chords):
            if p in c:
                presence[int(i * seg * SR) : int((i + 1) * seg * SR)] = 1
        env = np.clip(smooth_loop(presence, 5.5), 0, 1) if presence.min() == 0 else np.ones(n)
        f0 = midi(p)
        reg = 0.5 if p < 44 else 0.8 if p < 56 else 0.62
        voice = np.zeros((2, n))
        for k in range(1, 11):
            fk = f0 * k
            if fk > 5200:
                break
            a = k**-1.3 * np.exp(-((fk / 2400) ** 2))
            shimmer = 1 + 0.28 * np.sin(2 * np.pi * rng.integers(1, 4) / period * t + rng.uniform(0, 6.28))
            for det, pn in ((1.0, 0.0), (1.0024, -0.65), (0.9979, 0.65)):
                s = a * shimmer * np.sin(2 * np.pi * grid(fk * det, period) * t + rng.uniform(0, 6.28))
                voice += pan(s, pn)
        out += voice * env * reg
    out *= 1 + 0.12 * np.sin(2 * np.pi * t / 16)
    out = spectral(out, lambda f: lowpass(5200, 2)(f) * highpass(70, 2)(f))
    out = reverb_loop(out, impulse(5.5, 0.03, 0.8, 1), wet=0.75, dry=0.55)
    return level(out, -20)


def keys(period=36):
    n = period * SR
    out = np.zeros((2, n))
    scale = [62, 64, 66, 69, 71, 74, 76, 78, 81]
    weights = np.array([1.0, 0.9, 1.0, 1.2, 0.9, 1.0, 0.7, 0.6, 0.4])
    weights /= weights.sum()
    at = 0.4
    i = 0
    while at < period - 0.5:
        p = int(rng.choice(scale, p=weights))
        vel = rng.uniform(0.35, 0.8)
        note = piano(midi(p), 7.5, vel, 1.0, seed=i)
        place(out, pan(note, np.clip((p - 70) / 14 + rng.uniform(-0.2, 0.2), -0.8, 0.8)), at)
        if rng.random() < 0.28:
            j = scale.index(p)
            q = scale[max(0, j - int(rng.choice([2, 3])))]
            place(out, pan(piano(midi(q), 7.5, vel * 0.7, 1.0, seed=i + 500) , -0.2), at + rng.uniform(0.05, 0.14))
        if rng.random() < 0.12:
            place(out, pan(piano(midi(rng.choice([50, 57])), 7.5, 0.45, 1.2, seed=i + 900), -0.35), at)
        at += rng.uniform(2.2, 4.6)
        i += 1
    out = spectral(out, lowpass(3400, 2))
    out = reverb_loop(out, impulse(4.5, 0.035, 0.7, 2), wet=0.85, dry=0.5)
    return level(out, -21)


def air(period=24):
    n = period * SR
    t = np.arange(n) / SR
    f = np.fft.rfftfreq(n, 1 / SR)
    out = np.zeros((2, n))
    for centre, width, gain in ((320, 0.9, 1.0), (850, 0.8, 0.7), (2100, 0.7, 0.35)):
        shape = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / centre) / width) ** 2) / np.sqrt(np.maximum(f, 20) / 200)
        gust = sum(np.sin(2 * np.pi * k / period * t + rng.uniform(0, 6.28)) * w for k, w in ((1, 0.6), (2, 0.3), (5, 0.15)))
        gust = 0.15 + 0.85 * (gust - gust.min()) / (gust.max() - gust.min())
        for ch in range(2):
            spec = np.exp(1j * rng.uniform(0, 2 * np.pi, f.size)) * shape
            spec[0] = 0
            band = np.fft.irfft(spec, n)
            out[ch] += band / np.sqrt(np.mean(band**2)) * gust * gain
    glass = np.zeros((2, n))
    for p, g in ((86, 1.0), (93, 0.7), (90, 0.5), (100, 0.3)):
        trem = 0.5 + 0.5 * np.sin(2 * np.pi * rng.integers(1, 4) / period * t + rng.uniform(0, 6.28))
        glass += pan(g * trem**2 * np.sin(2 * np.pi * grid(midi(p), period) * t), rng.uniform(-0.7, 0.7))
    out = out / np.sqrt(np.mean(out**2)) + glass / np.sqrt(np.mean(glass**2)) * 0.22
    out = reverb_loop(out, impulse(3.2, 0.02, 0.9, 3), wet=0.5, dry=0.8)
    return level(out, -22)


def pulse(period=12):
    n = period * SR
    out = np.zeros((2, n))
    beat = 60 / 80

    def thump(vel, seed):
        m = int(0.9 * SR)
        t = np.arange(m) / SR
        f = 62 + 45 * np.exp(-t / 0.03)
        ph = 2 * np.pi * np.cumsum(f) / SR
        # Harmonics carry the beat on small speakers that can't play the fundamental.
        body = np.sin(ph) + 0.7 * np.sin(2 * ph) + 0.4 * np.sin(3 * ph) + 0.18 * np.sin(4 * ph)
        env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.22)
        r = np.random.default_rng(seed)
        felt = np.fft.irfft(np.fft.rfft(r.standard_normal(m) * np.exp(-t / 0.02)) * lowpass(700, 2)(np.fft.rfftfreq(m, 1 / SR)), m)
        return (body * env + felt * 0.5) * vel

    def brush(vel, seed):
        m = int(0.25 * SR)
        t = np.arange(m) / SR
        r = np.random.default_rng(seed)
        fr = np.fft.rfftfreq(m, 1 / SR)
        s = np.fft.irfft(np.fft.rfft(r.standard_normal(m)) * np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / 5200) / 0.6) ** 2), m)
        return s / np.max(np.abs(s)) * (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.045) * vel

    for b in range(0, int(period / beat), 2):
        at = b * beat
        place(out, pan(thump(1.0, b), 0), at)
        place(out, pan(thump(0.55, b + 100), 0), at + 0.29)
    for e in range(int(period / (beat / 2))):
        vel = 0.12 if e % 2 else 0.06
        place(out, pan(brush(vel * rng.uniform(0.8, 1.1), e + 300), 0.35 if e % 2 else -0.35), e * beat / 2)
    out = spectral(out, highpass(50, 2))
    out = reverb_loop(out, impulse(1.8, 0.012, 0.6, 4), wet=0.3, dry=0.9)
    return level(out, -21)


# ── Cues ───────────────────────────────────────────────────────────────


def tick():
    m = int(0.12 * SR)
    t = np.arange(m) / SR
    s = np.sin(2 * np.pi * 2637 * t) * np.exp(-t / 0.011) + 0.35 * np.sin(2 * np.pi * 3951 * t) * np.exp(-t / 0.007)
    s *= 1 - np.exp(-t / 0.0008)
    return reverb_once(pan(s, 0), impulse(0.5, 0.004, 0.8, 5), wet=0.18)


def tap():
    s = piano(midi(86), 0.6, 0.55, 0.22, seed=7)
    return reverb_once(pan(s, 0), impulse(0.9, 0.008, 0.8, 6), wet=0.22)


def swell():
    m = int(2.0 * SR)
    t = np.arange(m) / SR
    fr = np.fft.rfftfreq(m, 1 / SR)
    out = np.zeros((2, m))
    hump = np.sin(np.pi * np.clip(t / 1.5, 0, 1)) ** 2
    for i, (centre, peak) in enumerate(((300, 0.35), (900, 0.6), (2600, 0.85))):
        shape = np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / centre) / 0.7) ** 2)
        rise = np.exp(-0.5 * ((t / 1.5 - peak) / 0.25) ** 2)
        for ch in range(2):
            band = np.fft.irfft(np.fft.rfft(rng.standard_normal(m)) * shape, m)
            out[ch] += band / np.sqrt(np.mean(band**2)) * rise * hump * (0.6 if i == 2 else 1)
    bloom = np.zeros((2, m))
    for p, g, pn in ((86, 1.0, -0.3), (93, 0.6, 0.3), (90, 0.4, 0.0)):
        tt = np.maximum(t - 0.95, 0)
        bloom += pan(g * np.sin(2 * np.pi * midi(p) * t) * (1 - np.exp(-tt / 0.08)) * np.exp(-tt / 0.6) * (t > 0.95), pn)
    out = out * 0.5 + bloom * 0.35
    return reverb_once(out, impulse(2.4, 0.02, 0.8, 8), wet=0.55, dry=0.7)


def chime():
    a = piano(midi(81), 2.5, 0.5, 1.1, seed=9)
    b = piano(midi(86), 2.5, 0.55, 1.1, seed=10)
    out = np.zeros((2, int(2.8 * SR)))
    place(out, pan(a, -0.2), 0)
    place(out, pan(b, 0.2), 0.14)
    return reverb_once(out, impulse(2.6, 0.02, 0.8, 11), wet=0.5, dry=0.8)


def drop():
    m = int(0.25 * SR)
    t = np.arange(m) / SR
    f = 950 + 800 * (1 - np.exp(-t / 0.03))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.001)) * np.exp(-t / 0.05)
    return reverb_once(pan(s, 0), impulse(0.8, 0.01, 0.7, 12), wet=0.3)


# ── Output ─────────────────────────────────────────────────────────────


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    dither = (rng.random(x.shape) - rng.random(x.shape)) / 32768
    pcm = np.round((x + dither) * 32767).astype('<i2').T.copy()
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def publish(stem, x):
    """Encode to WebM/Opus and M4A/AAC, name by content hash, drop older versions."""
    names = {}
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / f'{stem}.wav'
        write_wav(src, x)
        for ext, args in (('webm', ['-c:a', 'libopus', '-b:a', '96k', '-vbr', 'on']), ('m4a', ['-c:a', 'aac', '-b:a', '128k'])):
            enc = Path(tmp) / f'{stem}.{ext}'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), *args, str(enc)], check=True)
            data = enc.read_bytes()
            name = f'{stem}.{hashlib.sha1(data).hexdigest()[:8]}.{ext}'
            for old in OUT.glob(f'{stem}.*.{ext}'):
                if old.name != name:
                    old.unlink()
            (OUT / name).write_bytes(data)
            names[ext] = f'/media/sound/{name}'
    return names


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {'pad': PAD, 'stems': {}, 'cues': {}}
    for name, fn, period in (('bed', bed, 32), ('keys', keys, 36), ('air', air, 24), ('pulse', pulse, 12)):
        x = fn(period)
        p = int(PAD * SR)
        padded = np.concatenate([x[:, -p:], x, x[:, :p]], axis=1)
        manifest['stems'][name] = {'period': period, **publish(name, padded)}
        print(f'{name}: {period}s, rms {20 * np.log10(np.sqrt(np.mean(x**2))):.1f} dB')
    for name, fn in (('tick', tick), ('tap', tap), ('swell', swell), ('chime', chime), ('drop', drop)):
        x = fn()
        x = x / np.max(np.abs(x)) * 0.8
        # Trim the silent end of the reverb tail, with a short fade.
        loud = np.nonzero(np.abs(x).max(axis=0) > 10 ** (-58 / 20))[0]
        end = min(x.shape[-1], loud[-1] + int(0.02 * SR))
        x = x[:, :end] * np.minimum(1, (end - np.arange(end)) / (0.02 * SR))
        manifest['cues'][name] = publish(name, x)
        print(f'{name}: {x.shape[-1] / SR:.2f}s')
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print('wrote', MANIFEST.relative_to(ROOT))


if __name__ == '__main__':
    main()
