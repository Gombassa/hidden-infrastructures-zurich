# max/

Max for Live patch development for **Hidden Infrastructures: Zürich** — **superseded as of July 2026.**

The Max/MSP → RNBO → WASM production-audio path documented below has been dropped in favour of browser-native Web Audio instruments authored directly in JavaScript. See `docs/Technical_Architecture_v5.md` and `docs/Implementation_Plan.md` for the current architecture and build plan.

This directory's content remains valuable as sonic specification — signal chains, proximity mappings, envelope shapes, and the MIDI control mappings in `fernwaerme/fernwaerme-spec.md` and `sewage/sewage-spec.md` — and the translation work for each new instrument reads from it. `sewage/circleoffifths.js` is plain JS (not a Max patch) and is directly reusable, not something to translate.

The patch and object-level inventory previously here has moved to `docs/archive/max/` (`patch-inventory.md`, `TECHNICAL_NOTES.md`) with superseded headers.

## Subdirectories

| Directory | Layer |
|---|---|
| `fernwaerme/` | Fernwärme (district heating) — spec + MIDI mapping |
| `sewage/` | Sewage — spec, MIDI mapping, `circleoffifths.js` (reusable) |

## Workflow (historical — not in use)

1. Author patch in Max/MSP with RNBO objects
2. Export from RNBO as Web target → `patch.wasm` + `rnbo.min.js`
3. Load in browser via `createDevice` from RNBO JS API
4. Connect device node to existing Web Audio API graph (PannerNode / StereoPanner)
5. Control parameters via `device.parametersById.get('paramName').value = x`
