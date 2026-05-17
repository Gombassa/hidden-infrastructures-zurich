# Sewage Patch Specification

## Overview

Sewage is the deep subsurface layer. Low-frequency noise-based rumble (distinct from Fernwärme's tonal 60Hz sine and Water's 800Hz pulse). Gurgle events are pitched using a circle-of-fifths sequence engine (`circleoffifths.js`) — MIDI notes routed to a low-register sine bank or sampler, giving the layer an unsettling melodic quality under the noise floor.

## Circle of Fifths Sequence Engine (`circleoffifths.js`)

### Purpose

Drives pitched gurgle events. Rather than random pitches, notes are drawn from a minor chord that advances around the circle of fifths, giving the sewage layer a coherent but slowly drifting harmonic identity.

### Chord Set

All 12 minor chords arranged in circle-of-fifths order (clockwise = +1, counter-clockwise = −1):

| Index | Chord | MIDI notes (6 voices) | Range |
|---|---|---|---|
| 0 | Am | 45 48 52 57 60 64 | A2–E4 |
| 1 | Em | 40 43 47 52 55 59 | E2–B3 |
| 2 | Bm | 35 38 42 47 50 54 | B1–F#3 |
| 3 | F#m | 42 45 49 54 57 61 | F#2–C#4 |
| 4 | C#m | 37 40 44 49 52 56 | C#2–G#3 |
| 5 | G#m | 44 47 51 56 59 63 | G#2–D#4 |
| 6 | Ebm | 39 42 46 51 54 58 | Eb2–Bb3 |
| 7 | Bbm | 34 37 41 46 49 53 | Bb1–F3 |
| 8 | Fm | 41 44 48 53 56 60 | F2–C4 |
| 9 | Cm | 36 39 43 48 51 55 | C2–G3 |
| 10 | Gm | 43 46 50 55 58 62 | G2–D4 |
| 11 | Dm | 38 41 45 50 53 57 | D2–A3 |

MIDI range across all chords: 34 (Bb1) – 64 (E4). All minor triads, two-octave voicing (root–minor-third–fifth × 2 octaves).

### Sequence Behaviour

- On each `bang`: emit the next note from the current sequence on outlet 0
- Sequence length: 7–16 notes (random, `7 + Math.floor(Math.random() * 10)`)
- Notes are drawn randomly from the 6 voices of the current chord (with repetition)
- When the sequence is exhausted: advance to adjacent chord (CW or CCW, 50/50), generate a new sequence, report chord name on outlet 1
- Outlets: outlet 0 = MIDI note number (int), outlet 1 = chord name string (e.g. `"Gm"`)

### Movement

`nextChord()` picks direction randomly each time the sequence ends:
```
dir = Math.random() < 0.5 ? 1 : -1
currentChord = (currentChord + dir + 12) % 12
```
This means harmonic motion drifts rather than cycles predictably. Over a long walk, the chord centre will wander the full circle.

### Inlets / Outlets

| Inlet/Outlet | Type | Description |
|---|---|---|
| inlet 0 | bang | Advance sequence by one step |
| outlet 0 | int | MIDI note number for current step |
| outlet 1 | symbol | Current chord name (fires on chord change only) |

## Signal Chain (Sewage layer, full)

```
[circleoffifths.js] ← bang from metro (alongside/gurgle timing)
    │ outlet 0: MIDI note
    │ outlet 1: chord name → display
    ↓
[makenote 80 200] → [noteout] → external synth / sampler
                              → [poly~ sewage_tone~] (internal sine bank option)

[noise~]
    → [lores~ 200 0.7] (lowpass rumble, cutoff scales with distance)
    → [*~] ← distance gain: [line~]
    → [*~] ← master gain
    → [send~ sewage_dry]
    → [*~] reverb send → [send~ density_reverb]
```

## Parameter Values (from JS implementation)

| Parameter | Value |
|---|---|
| Rumble proximity radius | 80 m |
| Gurgle below | 20 m |
| Junction thud entry radius | entry trigger |
| Junction thud cooldown | 10 s |
| Pipe crossing transient | 200 Hz, one-shot |
| Alongside interval | ~4000 ms ±35% jitter (2600–5400 ms) |
| Alongside gain | distance-modulated |
| Gurgle rate range | 1.25–5 s random |
| Gurgle frequency | 100 Hz |
| Max reverb send | see shared density reverb |

## Build Order

1. Noise rumble: `[noise~]` → `[lores~]` → distance gain → master gain
2. `circleoffifths.js` object, wire outlet 0 to `[makenote]` → `[noteout]`
3. Gurgle metro: random period (1250–5000ms), trigger when within 20m
4. Junction thud: `[adsr~]` on entry bang, 55Hz sine, 10s cooldown
5. Pipe crossing transient: 200Hz sine, single envelope
6. Alongside loop: jitter metro (2600–5400ms), toggle pad
7. MIDI control mapping
8. Reverb send

## RNBO Export Notes

- `circleoffifths.js` logic will need to be reimplemented as RNBO subpatch or as a JS node upstream feeding parameters — RNBO has no `js` object equivalent
- `lores~` → RNBO `lores~` (direct equivalent)
- `noise~` → RNBO `noise~` (direct equivalent)
- Chord name outlet (symbol) will need a workaround in RNBO — use an integer index instead and map to display externally
