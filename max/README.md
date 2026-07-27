# max/

Max for Live patch development for **Hidden Infrastructures: Zürich** — **superseded as of July 2026.**

The Max/MSP → RNBO → WASM production-audio path documented below has been dropped in favour of browser-native Web Audio instruments authored directly in JavaScript. See `docs/Technical_Architecture_v5.md` and `docs/Implementation_Plan.md` for the current architecture and build plan.

`fernwaerme/fernwaerme-spec.md` and `sewage/sewage-spec.md` now carry the same superseded header as the rest of this directory — including their MPK Mini Mk4 MIDI control-mapping tables, which are Max-era but still a reasonable starting point when designing each new instrument's own HTML control surface. `sewage/circleoffifths.js` is the one exception: it's plain JS, not a Max artifact, is not superseded, and should be wired into the new gurgle instrument as-is rather than reimplemented.

The patch and object-level inventory previously here has moved to `docs/archive/max/` (`patch-inventory.md`, `TECHNICAL_NOTES.md`) with the same superseded headers.

## Subdirectories

| Directory | Layer |
|---|---|
| `fernwaerme/` | Fernwärme (district heating) — superseded spec + MIDI mapping |
| `sewage/` | Sewage — superseded spec + MIDI mapping, `circleoffifths.js` (live, reusable) |

## Workflow (historical — not in use)

1. Author patch in Max/MSP with RNBO objects
2. Export from RNBO as Web target → `patch.wasm` + `rnbo.min.js`
3. Load in browser via `createDevice` from RNBO JS API
4. Connect device node to existing Web Audio API graph (PannerNode / StereoPanner)
5. Control parameters via `device.parametersById.get('paramName').value = x`
