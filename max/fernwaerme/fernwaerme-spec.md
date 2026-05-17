# Fernwärme Patch Specification

## Overview

Fernwärme is the district heating layer. A 60Hz sine tone with 0.3Hz tremolo LFO — warm and tonal, distinct from sewage (noise-based) and water (800Hz pulse). Encounters are rare: 30m radius means triggers are infrequent along the route, making each one a moment of discovery. Spatial position is driven by pipe bearing relative to listener heading, giving a left/right pan that changes as the listener turns or the pipe direction shifts.

## Signal Chain

```
[cycle~ 60]
    │
    ├─ Drone path:
    │   [*~] ← tremolo carrier: [cycle~ 0.3] → [*~ 0.4] → [+~ 1.0]
    │   [*~] ← master gain: [line~] (400ms ramp TC)
    │   [pan~] ← pan: [line~] (1000ms ramp TC, range 0–1)
    │   → stereo out
    │
    └─ Burst path (crossing + alongside):
        [*~] ← burst envelope: [adsr~] or [function]
        [pan~] ← same pan line~
        → stereo out

Sum → [*~] output level → [send~ fernwaerme_dry]
                        → [*~] reverb send → [send~ density_reverb]
```

## Parameter Values

| Parameter | Value |
|---|---|
| Oscillator frequency | 60 Hz |
| Tremolo rate | 0.3 Hz |
| Tremolo depth | ±0.4 (multiplicative on carrier gain — range 0.6–1.4) |
| Proximity radius | 30 m |
| Ramp-in time constant | 400 ms |
| Pan time constant | 1000 ms |
| Pan formula | `sin(relBearing)` → −1 to +1, mapped to 0–1 for `pan~` |
| Crossing burst | 60 Hz, 500 ms duration, gain 0.15, 3 s cooldown |
| Alongside interval | ~6000 ms ±40% jitter (3600–8400 ms range) |
| Alongside gain | ~0.08 |
| Max reverb send | 0.4 |

**Tremolo note:** The LFO must modulate a carrier gain node multiplicatively, not the master gain directly. Additive LFO on master gain bleeds through when master = 0, producing sound before Start and after Stop. Carrier path: `[cycle~ 0.3] → [*~ 0.4] → [+~ 1.0]` keeps range 0.6–1.4, then that carrier output multiplies the drone signal before master gain is applied.

## Alongside Jitter Implementation

```
[random 4800] → [+ 3600] → [metro] period in ms
```

Toggle on/off via pad. Metro self-cancels when layer is disabled — send `0` to stop message inlet before toggling the pad state. On re-enable, send `bang` to metro to restart immediately rather than waiting for next period expiry.

## MPK Mini Mk4 Control Mapping

Knobs default to CC 70–77 on channel 1:

| Knob | CC | Parameter | Range |
|---|---|---|---|
| K1 | 70 | Proximity (0 = 30 m away, 127 = at pipe) → master gain | 0.0–1.0 |
| K2 | 71 | Tremolo rate | 0.05–1.5 Hz |
| K3 | 72 | Tremolo depth | 0.0–0.8 |
| K4 | 73 | Pan / bearing simulation | −1.0–+1.0 → 0.0–1.0 |
| K5 | 74 | Output level | 0.0–1.0 |
| K6 | 75 | Reverb send | 0.0–0.4 |
| K7 | 76 | Burst gain | 0.0–0.3 |
| K8 | 77 | Ramp-in time (ms) | 50–2000 |

Pads default to MIDI notes 36–43 on channel 10:

| Pad | Note | Function |
|---|---|---|
| 1 | 36 | Trigger crossing burst (one-shot, 3 s cooldown) |
| 2 | 37 | Toggle alongside loop on/off |
| 3 | 38 | Toggle drone on/off |

## RNBO Export Notes

When porting to RNBO:

- `cycle~`, `*~`, `+~`, `line~`, `pan~` all have direct RNBO equivalents
- `send~` objects become parameter outputs (expose as inports/outports)
- `adsr~` maps to RNBO's `adsr~`
- `random` for alongside jitter will need a `rnbo.random` substitute — flag this when beginning the RNBO port; no direct equivalent in the RNBO object set as of writing

## Build Order

1. Core drone: `[cycle~ 60]` + tremolo carrier + master gain `[line~]`
2. Pan: bearing → `sin()` → `[line~]` → `[pan~]`
3. Crossing burst: `[adsr~]` triggered by pad 1, routed through same `[pan~]`
4. Alongside loop: jitter metro → burst envelope, toggled by pad 2
5. MIDI control mapping: `[ctlin]` → scale → parameter targets
6. Reverb send: tap after output level `[*~]`, scale by reverb send knob → `[send~ density_reverb]`
