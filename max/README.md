# max/

Max for Live patch development for **Hidden Infrastructures: Zürich**.

Patches are authored here for eventual RNBO export to the browser (WASM AudioWorklet). One subdirectory per infrastructure layer.

## Subdirectories

| Directory | Layer |
|---|---|
| `fernwaerme/` | Fernwärme (district heating) |

## Workflow

1. Author patch in Max/MSP with RNBO objects
2. Export from RNBO as Web target → `patch.wasm` + `rnbo.min.js`
3. Load in browser via `createDevice` from RNBO JS API
4. Connect device node to existing Web Audio API graph (PannerNode / StereoPanner)
5. Control parameters via `device.parametersById.get('paramName').value = x`

See `CLAUDE.md` for full RNBO integration notes.
