# Hidden Infrastructures: Zürich — Instrument Implementation Plan

**Document version:** 1.0
**Date:** July 2026
**Companion to:** `docs/Technical_Architecture_v5.md` (architecture, interface-contract candidates, open questions), `docs/Project_Plan_v3_5.md` (phase calendar, budget, timeline reality check)

This document is the build plan for Phase 3 of `Project_Plan_v3_5.md`: replacing `src/audio-layers.js` with self-contained instrument modules and HTML control surfaces. It does not repeat the architecture rationale — see the Architecture doc for why this pivot happened and what the interface-contract candidates are.

---

## Instrument Inventory

23 instruments across 6 layers, one per sonic behaviour (see `docs/Technical_Architecture_v5.md` for the granularity decision and how this count was derived). "Spec" = an archived Max for Live patch exists at `docs/archive/max/patch-inventory.md` documenting its signal chain; "no spec" = the behaviour was added to `audio-layers.js` after the Max patches were authored and has to be built directly from the current JS.

| # | Layer | Instrument | Spec? | Pool? |
|---|---|---|---|---|
| 1 | Water | Proximity pulse | Yes | No |
| 2 | Water | Fitting-cluster drip | Yes | No |
| 3 | Water | Pipe-crossing knock | No | No |
| 4 | Water | Alongside loop | No | No |
| 5 | Electricity | Oscillator pool (density gain folded in) | Yes | Yes — persistent claim/release |
| 6 | Electricity | Cable-crossing snap | Yes | No |
| 7 | Electricity | Alongside loop | Yes | No |
| 8 | Tram | Feeder crackle | Yes | No |
| 9 | Tram | Hiss pool | Yes | Yes — stateless nearest-N reassignment |
| 10 | Tram | Drone | Yes | No |
| 11 | Sewage | Continuous rumble | Yes | No |
| 12 | Sewage | Junction thud | Yes | No |
| 13 | Sewage | Pipe crossing | Yes | No |
| 14 | Sewage | Rhythmic gurgle | Yes | No (uses `circleoffifths.js`, reusable as-is) |
| 15 | Sewage | Alongside loop | Yes | No |
| 16 | Telecom | Burst pool (density modulation folded in) | Yes | Yes — always-on, collective gating, no per-feature claim |
| 17 | Telecom | Node-entry chirp | Yes | No |
| 18 | Telecom | Node dwell handshake | Yes | No |
| 19 | Telecom | Cable-crossing click | Yes | No |
| 20 | Telecom | Alongside loop | Yes | No |
| 21 | Fernwärme | Tone + tremolo + bearing panner | Yes | No |
| 22 | Fernwärme | Pipe-crossing burst | No | No |
| 23 | Fernwärme | Alongside loop | No | No |

19 have a spec, 4 don't (#3, #4, #22, #23 — water's and Fernwärme's crossing/alongside pair). All parameter values (frequencies, radii, cooldowns, jitter ranges) for every instrument are already documented in `docs/Technical_Architecture_v5.md`'s per-layer sections and should be sourced from there or from `src/audio-layers.js` directly — not from `docs/phase2-data-layer.md`, which has stale figures for unrelated reasons (feature counts, not audio parameters, but avoid it as a source out of caution).

---

## Build Order

### Step 1 — Interface contract proof (blocks everything else)

Build exactly two instruments, each under whichever of the three candidate contracts (Architecture doc, "The interface contract") seem most promising — or all three for the first one if it's cheap enough to tell quickly:

1. **Water proximity pulse** (#1) — the simplest possible case: a single one-shot, no pool, a documented spec (`WaterProximityPulse.amxd`) with a known translation issue already flagged (`docs/archive/max/TECHNICAL_NOTES.md`: "line~ has envelope as arguments not message-driven"). Good for proving lifecycle (`init`/`update`/`trigger`/`destroy`), parameter feed from ProximityEngine's shape, and HTML control-surface binding, without pool complexity muddying the read.
2. **Electricity oscillator pool** (#5) — the most conventional of the three existing pool paradigms (persistent claim/release keyed by feature ID, closest to a standard synth voice-allocation pattern), so it's the most representative single pool exemplar to validate the contract against. Deliberately *not* tram's hiss pool or telecom's burst pool here — those are each other's edge cases and are exercised later (see Steps 4 and 8) as checkpoints on whether the contract generalises, not as the first thing it's designed against.

**Done means:** interface contract chosen and written up; both instruments run standalone through their HTML control surfaces with MIDI input; both instruments, when fed live ProximityEngine output in the app, reproduce the current field-tested sound for that behaviour (not just "sounds plausible in isolation" — actually A/B against the current `audio-layers.js` behaviour on the same walk).

**Decision point (yours):** which contract to commit to. Also: whether to build all three candidates for instrument #1 before choosing, or eliminate fast off a read of the trade-offs and only build the winner. The Architecture doc doesn't resolve this — it's deliberately left to you after reading.

### Step 2 — Electricity layer completion

3. Cable-crossing snap (#6), alongside loop (#7) — both spec'd, both simple one-shot/loop shapes, and doing them immediately after the pool proof keeps the electricity-specific context (density gain, master gain gating) fresh rather than returning to it later.

**Done means:** electricity layer fully on the new architecture, field-validated against baseline.

### Step 3 — Water layer completion

4. Fitting-cluster drip (#2) — spec'd, similar shape to the already-built proximity pulse.
5. Pipe-crossing knock (#3), alongside loop (#4) — **no spec.** This is deliberately the first "build without a Max reference" case, but it's a low-complexity one (single 380Hz tone, one-shot vs. looped-with-jitter variant of the same sound) — a safe place to establish the pattern for translating straight from `audio-layers.js` before doing the same thing for Fernwärme (Step 9), which is sonically more novel.

**Done means:** water layer fully on the new architecture, field-validated.

### Step 4 — Tram layer (third pool paradigm checkpoint)

6. Feeder crackle (#8), hiss pool (#9), drone (#10) — all spec'd. Tram is architecturally distinct (HRTF PannerNode positioning, the hiss pool's stateless nearest-N-reassignment-per-tick model rather than persistent claim/release) and carries the one mapping curve already flagged as validated and not to be re-derived: crackle's (1−t)² falloff over `CRACKLE_FALLOFF_RADIUS` (150m). Doing tram as its own pass, after one pool paradigm (electricity) is already proven against the contract, tests whether the contract also holds for a meaningfully different pool shape — a checkpoint, not a gamble, since if it doesn't hold this is caught with only 2 layers built rather than 5.

**Done means:** tram layer fully on the new architecture, HRTF positioning confirmed working through the new instrument boundary, crackle's falloff curve carried forward unchanged, field-validated.

### Step 5 — Sewage layer

7. Continuous rumble (#11), junction thud (#12), pipe crossing (#13) — spec'd, straightforward.
8. Rhythmic gurgle (#14), alongside loop (#15) — spec'd, but gurgle is worth grouping separately because it wires in `max/sewage/circleoffifths.js` (a reusable chord-sequence engine, not a Max patch — see Architecture doc). This is integration work (loading a plain JS module into the new instrument) rather than translation work, so it's a different kind of task from the rest of this phase and benefits from being done as its own unit.

**Done means:** sewage layer fully on the new architecture, `circleoffifths.js` wired in without modification, field-validated.

### Step 6 — Telecom layer (second pool-paradigm checkpoint, most behaviourally dense layer)

9. Burst pool (#16), node-entry chirp (#17), node dwell handshake (#18), cable-crossing click (#19), alongside loop (#20) — all spec'd, but telecom is the densest layer (5 behaviours) and its pool paradigm (always-on collective gating, no per-feature claim at all) is the most different from the one the contract was proven against in Step 1. Deliberately placed after two other pool layers (electricity, tram) rather than first, so whatever's learned from those informs how telecom's very different pool shape gets fit into the same contract.

**Done means:** telecom layer fully on the new architecture, field-validated. If the contract needs an escape hatch for telecom's pool shape, this is where that becomes visible — flag it rather than forcing a fit that doesn't match how the pool actually behaves.

### Step 7 — Fernwärme layer

10. Tone + tremolo + bearing panner (#21) — spec'd, and unusually well-specified: `max/fernwaerme/fernwaerme-spec.md` includes a full MIDI CC mapping (MPK Mini Mk4, CC 70–77) that can likely be adapted close to verbatim for this instrument's control surface rather than designed from scratch.
11. Pipe-crossing burst (#22), alongside loop (#23) — **no spec**, same situation as water's crossing/alongside (Step 3), and deliberately last: by this point the pattern for building a spec-less instrument from `audio-layers.js` directly has already been established once (water), so this is confirmation, not discovery.

**Done means:** Fernwärme layer fully on the new architecture — StereoPanner bearing-driven positioning confirmed (Fernwärme uses StereoPanner rather than HRTF because HRTF localises poorly below ~200Hz; this constraint carries forward unchanged), field-validated. All 23 instruments complete; `src/audio-layers.js` retired.

### Step 8 — Reintegration and parity check

Wire the instrument set into the existing GPS/TramEngine/ProximityEngine data flow (no change to that flow is anticipated — it's the instruments' internal implementation that changed, not what feeds them). Do one full field walk of the Stadelhofen → Paradeplatz route comparing the rebuilt experience against the pre-rebuild baseline.

**Do not delete `src/audio-layers.js` until this comparison passes.** Keep it as the reference implementation (a tagged commit or a parallel branch works) through Steps 2–8 — if any instrument's behaviour drifts from the field-tested baseline, there needs to be a working comparison point, not just memory of how it used to sound.

**Done means:** no regression from the current field-tested experience; `audio-layers.js` can now be safely removed.

---

## Dependencies

- Step 1 hard-blocks Steps 2–7 (can't build 22 more instruments against an undecided contract).
- Steps 2–7 (per-layer) have no dependencies on each other — the order above is a reasoning-based recommendation for risk sequencing, not a technical requirement. They could be reordered or parallelised if more than one person were building, but as a solo effort the sequencing matters for catching contract problems early rather than late.
- Step 8 depends on all of Steps 2–7 being complete.
- PWA work (`Project_Plan_v3_5.md` Phase 4, Week 1) has only a soft dependency on this phase: Service Worker asset caching needs a final file list, which isn't stable until it's decided whether HTML control surfaces ship in the production build (open question, Architecture doc). Core app-shell caching (HTML/JS/GeoJSON) could reasonably start before Step 8 finishes; caching the control surfaces specifically should wait for that decision.
- User testing (`Project_Plan_v3_5.md` Phase 4, Week 2–3) hard-depends on Step 8 — testing an incomplete rebuild would produce feedback about bugs that are already known and about to be fixed, not useful signal.

---

## Decision Points Needing Your Input

1. **Interface contract** (Step 1) — which of the three candidates in `docs/Technical_Architecture_v5.md`, after seeing at least the water pulse and electricity pool built.
2. **HTML control surfaces: ship in production or authoring-only?** Affects both the PWA caching scope above and possibly how many surfaces get built at all (see Timeline Reality Check in the Project Plan). Decide once at least a couple of surfaces exist and can be tried, not before.
3. **Pool-exhaustion behaviour** (silent drop vs. nearest-wins swap) for each pool instrument (#5 electricity, #9 tram hiss, #16 telecom burst) — currently inherited by accident (electricity silently drops, telecom has no exhaustion case at all). Needs an explicit answer per pool, not carried forward unexamined.
4. **Granularity: hold at 23 per-behaviour modules, or consolidate toward per-layer instruments with behaviour modes now?** Cheaper to decide before Step 2 starts than after 20+ modules already exist in the per-behaviour shape.
5. **Timeline trade-off** (`Project_Plan_v3_5.md`, Timeline Reality Check) — which of the listed cuts (if any) to accept to land closer to September, or accept a slip into October.
6. **`max/fernwaerme/fernwaerme-spec.md`, `max/sewage/sewage-spec.md`, `max/README.md`** — not touched by this pivot's archival step (only `patch-inventory.md` and `TECHNICAL_NOTES.md` were named for that). They still contain valuable MIDI-mapping and signal-chain detail relevant to the control-surface work in Steps 2–7. Worth deciding whether they get the same "superseded, retained as spec" header treatment, or stay as-is since they're still being actively read during the build.

---

## Risks

- **Contract doesn't generalise past Step 1's single pool paradigm.** Mitigated by design: Step 4 (tram) and Step 6 (telecom) are explicit checkpoints against the other two pool shapes, placed early enough in the sequence that a bad fit is caught with 2–3 layers built, not 5.
- **HTML control surface scope balloons.** 23 surfaces is a lot of bespoke UI even if each is small. If this starts dominating the timeline, it's the first thing to cut per the Project Plan's Timeline Reality Check — the surfaces are an authoring tool, not shipped functionality, pending decision point #2 above.
- **Regression during the rebuild.** Mitigated by not deleting `src/audio-layers.js` until Step 8's parity check passes (see above).
- **Stale data pulled into an instrument's parameters.** `docs/phase2-data-layer.md` has feature counts from an earlier 12-order snapshot; if a radius or count gets copied from there instead of from `docs/Technical_Architecture_v5.md` or live code, it'll be wrong. Source parameters from the architecture doc's tables or the current `src/audio-layers.js`/`src/proximity-engine.js`, not from the data-layer iteration log.
- **Grant-deadline contention.** The Umsetzung und Präsentation application (1 September) sits inside Step 2–6's build window and will take real days away from instrument work — already factored into the Project Plan's Timeline Reality Check, not an unaccounted-for risk, but worth naming here so it isn't forgotten mid-build.
