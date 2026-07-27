> **Superseded.** These are environment notes for the Max for Live / RNBO authoring path, dropped in July 2026 in favour of browser-native Web Audio instruments (see `docs/Technical_Architecture_v5.md` and `docs/Implementation_Plan.md`). No longer maintained.
>
> Retained as sonic specification. The object-level findings below (`line~` message syntax, `adsr~`/`comb~`/`reson~` limitations, gate/cooldown patterns, pool slot-gating) are Max-specific and now historical — Web Audio API has different primitives and different constraints. But the underlying design decisions they encode — the one-shot-with-cooldown pattern, the randomised-loop-with-jitter pattern, the 50ms slot-ramp to avoid clicks, the pool gating approach itself — carry forward directly into the new instrument design. One mapping curve is called out explicitly as validated and carried forward without re-derivation: the **feeder crackle (1−t)² falloff**, `CRACKLE_FALLOFF_RADIUS` 150m, in `src/audio-layers.js`. The other layers' proximity-to-gain curves (mostly linear) have not had the same scrutiny and should get an audit pass as part of the new instrument build, not be assumed correct by default.

# Max for Live Technical Notes
## Environment: Max 8 / Live 10

### Output and routing
- Output: `plugout~` not `dac~`
- Pan: `M4L.pan1~` (range -50 to 50, 0 = centre)
- Pan scaling: `* 50` before `pack 0. 1000` — bearing sin(relBearing) gives -1 to 1, scaled to -50 to 50
- Limiter: `limi~ 0.8` before M4L.pan1~ on all patches

### line~ behaviour
- Starts at 0 on load — must receive a message before outputting non-zero
- Envelope format: `0.14 5 0 600` as single list (no commas — comma syntax sends simultaneous messages, last one wins, peak never reached)
- Proximity pattern: `flonum → pack 0. 400 → line~ → *~ right inlet`
- Frequency sweep: `message box → line~ → cycle~ frequency inlet`

### *~ behaviour
- Right inlet defaults to 0 if nothing connected — always wire or use fixed argument
- Multiple signals on left inlet sum correctly

### Filters
- `reson~` takes resonance 0–1 (not Q). Unstable above 0.4 with signal-rate modulation. Use onepole~ smoothing on any rand~ feeding reson~ frequency
- `lores~` is lowpass only. Highpass via subtraction: `noise~ → lores~ → -~ ← noise~`
- `comb~` non-functional in this environment — replaced with lores~ at different cutoffs per slot
- `clip~ -1. 1.` after filters where instability risk exists

### Envelopes
- `adsr~` unreliable — use `line~` with list message
- `line~ N` argument sets default ramp time in ms (not initial value)
- Burst pattern: `button → message box → line~` where message box contains e.g. `0.14 5 0 600`

### JavaScript (js object)
- Metro sends integers not bangs — add `msg_int` handler: `function msg_int(v) { bang(); }`
- File must be in same folder as .amxd for Max to find it
- `outlet()` calls at file load time may fail — init via loadbang instead
- `circleoffifths.js`: circle of fifths minor chord sequence engine for SewageGurgle

### Gate/cooldown pattern
- `gate 1` not `gate 2` for single-output cooldown
- Must initialise with `loadbang → 1 → gate inlet 1` or gate starts closed
- `t b b` fires right outlet first then left — use right for gate close + metro start

### Pool architectures
- Slot gates: `toggle → line~ 50 → *~ right inlet` (50ms prevents clicks on entry/exit)
- Per-slot spatial control deferred to RNBO export — shared master gain/pan used in M4L patches
- Density multiplier (electricity): additional `*~` after master sum, flonum range 1.0–1.8

### Known issues / deferred
- WaterProximityPulse: line~ has envelope as arguments not message-driven — needs fix
- SewageAlongside: comma in message box — may cause envelope issue
- FittingDrip: comma in message box — may cause envelope issue
- TramPowerDrone: verify *~ master gain right inlet is connected
- All patches need loadbang → proximity flonum initialisation to avoid line~ starting at 0
