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
