# Max for Live Patch Inventory

All .amxd files live in:
`C:\Users\robin\Documents\Ableton\Hidden Infrastructures Project\Patches\`

Copy to the corresponding repo subdirectory for documentation purposes.
.amxd files are gitignored — only documentation is tracked.

## Fernwärme
| Patch | Key objects | Notes |
|---|---|---|
| Fernwärme.amxd | cycle~, reson~, noise~, M4L.pan1~ | 60Hz sine + filtered noise texture. Tremolo rate and depth proximity-variable. reson~ tracks oscillator frequency at half-frequency via / 2 |

## Sewage
| Patch | Key objects | Notes |
|---|---|---|
| SewageContinuousRumble.amxd | 2× noise~ + lores~, rand~ modulation, onepole~ smoothing | Dual lowpass noise with signal-rate freq modulation. onepole~ 5 smooths rand~ to prevent instability clicks. clip~ -1. 1. on each filter output |
| SewageGurgle.amxd | js circleoffifths.js, reson~ 100 0.7 0, cycle~, metro | Circle of fifths minor chord sequence engine. js receives msg_int not bang — metro feeds via msg_int handler |
| JunctionThud.amxd | cycle~ 55, toggle + metro + random jitter | 55Hz burst. Random interval 6500–13500ms (10s ±35%). Proximity and pan gates |
| PipeXing.amxd | cycle~ 200, gate 1, t b b, metro 3000 | 200Hz crossing transient. 3s cooldown via gate 1 + loadbang init |
| SewageAlongside.amxd | cycle~ 200, toggle + metro + random jitter | ~4s ±35% jitter loop |

## Water
| Patch | Key objects | Notes |
|---|---|---|
| WaterProximityPulse.amxd | cycle~ 800 | Entry pulse on proximity threshold crossing |
| FittingDrip.amxd | cycle~ 2800, metro + random jitter | Random drip rate 250–750ms |

## Electricity
| Patch | Key objects | Notes |
|---|---|---|
| ElectrictyPool.amxd | 8× saw~ (1490–1510Hz), 8× cycle~ LFO, 8× line~ 50 slot gates, density flonum | Per-slot sawtooth oscillators with ±0.008 LFO beating. 8 toggle gates with 50ms ramp. Density multiplier 1.0–1.8 |
| CableXing.amxd | cycle~ 2200, gate 1, t b b, metro 3000 | 2200Hz snap. 3s cooldown |
| ElectricityAlongside.amxd | cycle~ 2200, toggle + metro + random jitter | ~5s ±40% jitter loop |

## Telecom
| Patch | Key objects | Notes |
|---|---|---|
| TelecomNoiseBurst.amxd | 4× noise~ + reson~ (5000/5600/6200/6800Hz) + lores~ HP, 4× LFO gates (22/38/54/78Hz), 4× line~ 50 slot gates | HP via noise~ - lores~ subtraction (-~). LFO gates convert ±1 to 0–1 via *~ 0.5 + +~ 0.5 |
| TelecomChirp.amxd | cycle~, freq line~ (2000→4000Hz 200ms), t b b | Node entry chirp. Frequency sweep via line~ → cycle~ frequency inlet |
| TelecomNodeDwell.amxd | cycle~, freq line~ (1000→8000Hz 400ms), t b b | 5s dwell handshake. Same structure as chirp, wider sweep |
| TelecomCableXing.amxd | cycle~, freq line~ (3500→6000Hz 60ms), gate 1, t b b, metro 3000 | Short high click. 3s cooldown |
| TeleAlongside.amxd | cycle~ 2200, toggle + metro + random jitter | ~4s ±45% jitter loop |

## Tram
| Patch | Key objects | Notes |
|---|---|---|
| TramPowerDrone.amxd | cycle~ 110, cycle~ 112, dual LFO sweep (0.017/0.023Hz ±8Hz), limi~ 0.8 | Dual oscillator with slow frequency sweep. limi~ before M4L.pan1~ |
| TramFeederCrackle.amxd | noise~, button trigger | Short noise burst 80ms on tram feeder entry |
| TramFeederHissPool.amxd | 6× noise~ + lores~ (800/1200/1800/2400/3200/4800Hz), 6× line~ 50 slot gates | Lowpass-filtered noise pool. Per-slot toggles with 50ms ramp |

---

## Standard Patch Architecture

All patches share this signal chain pattern:

```
[synthesis] → *~ (envelope) → *~ (proximity gain) → limi~ 0.8 → M4L.pan1~ → plugout~
Proximity gain:  flonum → pack 0. 400 → line~ → *~ right inlet
Pan:             flonum → * 50 → pack 0. 1000 → M4L.pan1~ right inlet
```

### Recurring trigger patterns

**One-shot with cooldown:**
```
loadbang → 1 → gate 1 inlet 1
button → gate 1 → t b b
left → message box → line~ (fires event)
right → 0 → gate inlet 1 (closes gate)
right → metro 3000 (starts cooldown)
metro → 1 → gate inlet 1 (reopens)
```

**Randomised loop:**
```
toggle → metro N
metro → random M → + offset → metro right inlet (self-patching jitter)
metro → message box → line~ (fires event)
```

**Oscillator pool slot gate:**
```
toggle → line~ 50 → *~ right inlet (50ms ramp prevents clicks)
```
