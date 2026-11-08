# Musique d'ambiance + effets sonores, générés entièrement en code (aucun sample externe).
import numpy as np, wave, sys
from scipy.signal import butter, sosfilt

SR = 48000
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 139.5
OUT = sys.argv[1]
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(1991)

def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x)
def bp(x, f1, f2, o=2): return sosfilt(sos('band', [f1, f2], o), x)
def keys(kf):
    ks = np.array([k for k, _ in kf]); vs = np.array([v for _, v in kf]); return np.interp(t, ks, vs)

bedL = np.zeros(N); bedR = np.zeros(N); sfxL = np.zeros(N); sfxR = np.zeros(N); revL = np.zeros(N); revR = np.zeros(N)
def add(buf, x, t0, pan=0.0, gain=1.0, send=0.0):
    i0 = int(t0 * SR); n = min(len(x), N - i0)
    if n <= 0 or i0 < 0: return
    l = np.cos((pan + 1) * np.pi / 4) * gain; r = np.sin((pan + 1) * np.pi / 4) * gain
    if buf == 'bed': bedL[i0:i0 + n] += x[:n] * l; bedR[i0:i0 + n] += x[:n] * r
    else: sfxL[i0:i0 + n] += x[:n] * l; sfxR[i0:i0 + n] += x[:n] * r
    if send: revL[i0:i0 + n] += x[:n] * l * send; revR[i0:i0 + n] += x[:n] * r * send

# ---------------- intensité de la musique (suit l'histoire) ----------------
I = keys([(0, .65), (1.8, .5), (10.5, .6), (14.5, .75), (16.9, .3), (27.5, .55), (34, .78), (39.5, .62), (42.3, .03), (43.5, .03), (44.5, .5),
          (50.4, .72), (57.6, .55), (65.6, .62), (77, .85), (85.6, .62), (92.8, .75), (101, .9), (103.05, .08), (104.2, .45), (107.6, .72),
          (118.7, .65), (125, .7), (127.9, .82), (129, .6), (132.3, .35), (DUR - 2, .3), (DUR, 0)])

# ---------------- drone grave (ré mineur) ----------------
def osc(freq, phase0=0.0, lfo_rate=0.07, lfo_depth=0.0):
    f = freq * (1 + lfo_depth * np.sin(2 * np.pi * lfo_rate * t + phase0))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase0)
drone_freqs = [(36.71, .55), (55.0, .35), (73.42, .28), (87.31, .16), (110.0, .10)]
dL = np.zeros(N); dR = np.zeros(N)
for k, (f, a) in enumerate(drone_freqs):
    dL += a * osc(f - .12, k * .7, .05 + k * .013, .002); dR += a * osc(f + .12, k * 1.3, .06 + k * .011, .002)
# dissonance (mi bémol) qui monte avec la tension
dis = np.clip((I - .62) / .3, 0, 1)
dL += .14 * dis * osc(77.78 - .1, 2.0); dR += .14 * dis * osc(77.78 + .1, 2.4)
# souffle « scie » filtré : sombre quand c'est calme, plus brillant en tension
saw = lambda f, ph: 2 * ((f * t + ph) % 1.0) - 1
padL = sum(saw(f * 2, .1 * k) for k, f in enumerate([73.42, 87.31, 110.0, 146.83])) / 4
padR = sum(saw(f * 2 * 1.003, .3 * k) for k, f in enumerate([73.42, 87.31, 110.0, 146.83])) / 4
mixb = np.clip((I - .3) / .6, 0, 1)
padL = lp(padL, 180, 4) * (1 - mixb) + lp(padL, 700, 4) * mixb
padR = lp(padR, 180, 4) * (1 - mixb) + lp(padR, 700, 4) * mixb
slow = .75 + .25 * np.sin(2 * np.pi * t / 9.0)
bedL += (dL * .16 + padL * .09 * slow) * I; bedR += (dR * .16 + padR * .09 * slow) * I
# nappe aiguë dissonante (cordes fantômes)
str_amp = np.clip((I - .55) / .35, 0, 1) ** 1.5 * .035
for f, ph in [(587.33, 0), (622.25, 1), (880.0, 2)]:
    v = np.sin(2 * np.pi * np.cumsum(f * (1 + .004 * np.sin(2 * np.pi * 5.3 * t + ph))) / SR)
    bedL += v * str_amp * (.8 if ph != 1 else .5); bedR += v * str_amp * (.6 if ph != 0 else .9)
# souffle / bruit de pièce
wn = rng.standard_normal(N); pink = lp(wn, 400, 2) * .5 + lp(wn, 90, 1)
bedL += pink * .045 * (.4 + I); bedR += np.roll(pink, 2400) * .045 * (.4 + I)

# ---------------- effets ----------------
def adsr(n, a, r, curve=4.0):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e *= np.exp(-curve * np.maximum(0, np.arange(n) / SR - a) / max(r, 1e-3)); return e
def boom(t0, g=1.0):
    n = int(SR * 3.0); tt = np.arange(n) / SR
    f = 30 + 70 * np.exp(-tt * 3.0); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    nz = lp(rng.standard_normal(n), 900, 2) * np.exp(-tt * 9) * .5
    x = (s + nz) * .9
    add('sfx', x, t0 - .02, 0, .55 * g, send=.35)
def hit(t0, g=1.0):  # impact plus court (inventaire)
    n = int(SR * 1.2); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(45 + 60 * np.exp(-tt * 12)) / SR) * np.exp(-tt * 4)
    c = hp(rng.standard_normal(n), 2000, 2) * np.exp(-tt * 60) * .25
    add('sfx', s + c, t0 - .01, 0, .5 * g, send=.25)
def heartbeat(t0, g=1.0):
    for dt, gg in [(0, 1.0), (.27, .7)]:
        n = int(SR * .4); tt = np.arange(n) / SR
        s = np.sin(2 * np.pi * np.cumsum(58 - 18 * tt / .4) / SR) * np.exp(-tt * 14) * (1 - np.exp(-tt * 400))
        add('sfx', lp(s, 160, 2) * 1.6, t0 + dt, 0, .6 * g * gg)
def heartbeats(t0, t1, bpm0, bpm1, g=1.0):
    tt = t0
    while tt < t1:
        k = (tt - t0) / max(1e-3, t1 - t0); bpm = bpm0 + (bpm1 - bpm0) * k
        heartbeat(tt, g); tt += 60 / bpm
def whoosh(t0, dur=1.0, g=1.0, up=True):
    n = int(SR * dur); tt = np.arange(n) / SR; x = rng.standard_normal(n)
    k = tt / dur; env = np.sin(np.pi * k) ** 2
    fc = (300 + 3000 * k) if up else (3300 - 3000 * k)
    out = np.zeros(n); seg = 2400
    for i in range(0, n, seg):
        f = float(np.mean(fc[i:i + seg])); out[i:i + seg] = bp(x[i:i + seg + 1000], f * .6, min(f * 1.6, 20000))[:len(out[i:i + seg])]
    add('sfx', out * env, t0, (-.6 if up else .6), .22 * g, send=.3)
def rewind(t0, dur, g=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    f = 900 + 2500 * (tt / dur) + 400 * np.sin(2 * np.pi * 13 * tt)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + hp(rng.standard_normal(n), 3000) * .5
    s = lp(s, 6000, 2) * np.sin(np.pi * tt / dur) ** .5 * (.5 + .5 * (np.sin(2 * np.pi * 7 * tt) > 0))
    add('sfx', s, t0, 0, .09 * g, send=.1)
def bell_note(f, dur=2.5, g=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    det = 1 + rng.uniform(-.008, .008)
    x = (np.sin(2 * np.pi * f * det * tt) * np.exp(-tt * 1.6) + .45 * np.sin(2 * np.pi * f * 2.0 * det * tt) * np.exp(-tt * 3.0)
         + .25 * np.sin(2 * np.pi * f * 3.01 * tt) * np.exp(-tt * 5) + .12 * np.sin(2 * np.pi * f * 4.2 * tt) * np.exp(-tt * 9))
    trem = 1 + .15 * np.sin(2 * np.pi * 4.5 * tt)
    return x * trem * (1 - np.exp(-tt * 300)) * g
def musicbox(t0, t1):
    mel = [74, 81, 77, 76, 74, 69, 73, 76, 74, 77, 81, 82, 81, 77, 76, 73, 74, 81, 77, 76, 74, 70, 69, 74]
    tt = t0; i = 0
    while tt < t1:
        m = mel[i % len(mel)]; f = 440 * 2 ** ((m - 69) / 12) * (1 + rng.uniform(-.006, .006))
        add('bed', bell_note(f, 2.2, .5), tt, rng.uniform(-.4, .4), .16, send=.6); tt += .52 + (.12 if i % 4 == 3 else 0); i += 1
def shutter(t0, g=1.0):
    for dt, gg in [(0, 1), (.045, .6)]:
        n = int(SR * .06); tt = np.arange(n) / SR
        add('sfx', hp(rng.standard_normal(n), 2500) * np.exp(-tt * 120), t0 + dt, .3, .35 * g * gg, send=.15)
    n = int(SR * .5); tt = np.arange(n) / SR
    add('sfx', np.sin(2 * np.pi * np.cumsum(3000 + 5000 * tt / .5) / SR) * np.exp(-tt * 6) * .2, t0 + .05, .3, .12 * g)
def siren(t0, dur, g=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    f = 950 + 450 * np.sin(2 * np.pi * tt / 2.2 - np.pi / 2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    env = np.minimum(1, tt / 1.5) * np.minimum(1, (dur - tt) / 1.5)
    add('sfx', lp(s, 2500, 2) * env, t0, -.5, .05 * g, send=.6)
def ticks(t0, t1, step, g=1.0):
    tt = t0; k = 0
    while tt < t1:
        n = int(SR * .05); x = bp(rng.standard_normal(n), 2500, 6000) * np.exp(-np.arange(n) / SR * 140)
        add('sfx', x, tt, (.25 if k % 2 else -.25), .3 * g * (.6 + .4 * (tt - t0) / max(1e-3, t1 - t0)), send=.1); tt += step; k += 1
def gavel(t0, g=1.0):
    n = int(SR * .5); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 300, 1400) * np.exp(-tt * 45) + np.sin(2 * np.pi * 120 * tt) * np.exp(-tt * 25) * .8
    add('sfx', x, t0, 0, .55 * g, send=.4)
def clang(t0, g=1.0):
    n = int(SR * 3); tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(523, 1, 2.5), (1187, .7, 3.2), (1873, .5, 4), (2711, .35, 5), (3517, .2, 7)])
    x += hp(rng.standard_normal(n), 3000) * np.exp(-tt * 50) * .5
    add('sfx', x, t0, .2, .22 * g, send=.5)
def glitch(t0, dur, g=1.0):
    n = int(SR * dur); x = np.zeros(n); i = 0
    while i < n:
        L = int(SR * rng.uniform(.015, .07)); kind = rng.integers(3); tt = np.arange(min(L, n - i)) / SR
        if kind == 0: seg = np.sign(np.sin(2 * np.pi * rng.uniform(200, 1800) * tt))
        elif kind == 1: seg = np.round(rng.standard_normal(len(tt)) * 3) / 3
        else: seg = np.zeros(len(tt))
        x[i:i + len(tt)] = seg; i += L + int(SR * rng.uniform(0, .04))
    add('sfx', lp(x, 7000, 2), t0, rng.uniform(-.3, .3), .07 * g)
def buzz(t0, dur, g=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * 120 * h * tt) / h for h in range(1, 12)) * (1 + .3 * (rng.random(n) > .997))
    env = np.minimum(1, tt / .5) * np.minimum(1, (dur - tt) / .5)
    add('sfx', lp(x, 3000, 2) * env, t0, .4, .022 * g)
def drill(t0, dur, g=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    f = 1400 + 200 * np.sin(2 * np.pi * 31 * tt); x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .4 + np.sin(2 * np.pi * np.cumsum(f * .5) / SR)
    env = np.minimum(1, tt / .08) * np.minimum(1, (dur - tt) / .15)
    add('sfx', lp(x, 5000, 2) * env, t0, -.2, .035 * g, send=.3)
def toll(t0, g=1.0):
    n = int(SR * 6); tt = np.arange(n) / SR; f0 = 98.0
    x = sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt * d) for r, a, d in [(1, 1, .5), (2.0, .6, .7), (2.4, .45, .9), (3.0, .3, 1.2), (4.2, .25, 1.6), (5.4, .15, 2.2)])
    add('sfx', x * (1 - np.exp(-tt * 200)), t0, 0, .2 * g, send=.6)
def tinnitus(t0, dur, g=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    add('sfx', np.sin(2 * np.pi * 4200 * tt) * np.minimum(1, tt / .3) * np.minimum(1, (dur - tt) / .2), t0, 0, .012 * g)
def chord_pad(t0, t1, g=1.0):
    n = int(SR * (t1 - t0)); tt = np.arange(n) / SR
    x = np.zeros(n)
    for m in [50, 57, 62, 65, 69, 76]:
        f = 440 * 2 ** ((m - 69) / 12)
        for d in (-.4, .4): x += np.sin(2 * np.pi * (f + d) * tt + rng.uniform(0, 6))
    x = lp(x, 1400, 2) / 12
    env = np.minimum(1, tt / 2.0) * np.minimum(1, (t1 - t0 - tt) / 2.5)
    add('bed', x * env, t0, 0, .5 * g, send=.5)

# --- placement (calé sur la voix off, timeline finale) ---
heartbeat(.12, 1.2); heartbeat(.95, 1.3); glitch(0, 1.75, 1.2); tinnitus(0, 1.75)
boom(1.80, 1.2)
whoosh(9.9, .9); boom(10.66, .9)
rewind(15.3, 1.6); whoosh(16.4, .7, .8, False)
musicbox(17.1, 26.9); hit(22.18, .6)
whoosh(27.0, .7, .8)
heartbeats(33.6, 39.6, 72, 108, .9); boom(36.44, 1.1)
whoosh(42.0, .6, .7, False)
buzz(43.75, 6.5); boom(50.43, 1.0); glitch(50.43, .6)
whoosh(51.6, .6, .6); whoosh(57.8, .7, .8)
gavel(62.14); gavel(62.44, .7)
whoosh(65.3, .9, .9)
shutter(73.96); shutter(74.36, .8); shutter(74.58, .9)
boom(77.97, 1.1); glitch(77.97, .5); drill(79.09, .7)
heartbeats(83.9, 85.8, 70, 64, .9)
whoosh(86.0, .7, .8)
siren(92.6, 8.5)
ticks(101.0, 102.9, .25); boom(103.0, 1.25)
rewind(107.3, 1.1); whoosh(108.1, .6, .7, False)
hit(110.3); hit(112.35); hit(113.47); hit(115.81, .9); hit(116.45); shutter(117.71, .7)
whoosh(119.0, .7, .8)
hit(121.57, .9); gavel(124.21); gavel(124.5, .8); boom(127.89, 1.0); glitch(127.89, .6)
whoosh(128.8, .7, .8); clang(131.44)
toll(132.43); chord_pad(132.2, DUR); toll(135.67, .7)

# ---------------- réverbération (convolution) ----------------
def reverb(x, secs=2.8, seed=3):
    r = np.random.default_rng(seed); n = int(SR * secs); tt = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-tt * 6.9 / secs); ir = lp(ir, 5000, 1); ir[:int(SR * .012)] = 0; ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n; nf = 1 << int(np.ceil(np.log2(L)))
    return np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[:len(x)]
wetL = reverb(revL, seed=3); wetR = reverb(revR, seed=4)

# ---------------- ducking sous la voix ----------------
vo_path = sys.argv[3] if len(sys.argv) > 3 else None
duck_bed = np.ones(N); duck_sfx = np.ones(N)
if vo_path:
    w = wave.open(vo_path); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    hop = 480; e = np.sqrt(np.convolve(v ** 2, np.ones(hop) / hop, 'same'))[::hop]
    act = np.clip((20 * np.log10(e + 1e-9) + 45) / 15, 0, 1)
    sm = np.zeros_like(act); a_up, a_dn = .5, .04
    for i in range(1, len(act)): sm[i] = sm[i - 1] + (a_up if act[i] > sm[i - 1] else a_dn) * (act[i] - sm[i - 1])
    sm = np.interp(np.arange(N) / hop, np.arange(len(sm)), sm)
    duck_bed = 1 - .55 * sm; duck_sfx = 1 - .2 * sm

L = bedL * duck_bed + (sfxL + wetL * .5) * duck_sfx
R = bedR * duck_bed + (sfxR + wetR * .5) * duck_sfx
fade = np.minimum(1, (DUR - t) / 1.5); L *= fade; R *= fade
pk = max(np.max(np.abs(L)), np.max(np.abs(R))); print('peak', pk)
st = np.stack([L, R], 1) / max(pk, 1e-9) * .89
wo = wave.open(OUT, 'wb'); wo.setnchannels(2); wo.setsampwidth(2); wo.setframerate(SR)
wo.writeframes((st * 32767).astype(np.int16).tobytes()); wo.close(); print('ok', OUT, DUR)
