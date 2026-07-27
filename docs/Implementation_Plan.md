# Hidden Infrastructures: Zürich — Instrument Implementation Plan

**Document version:** 1.1
**Date:** July 2026
**Changes from 1.0 (correction pass):** Fixed two internal cross-reference errors (Fernwärme mislabelled "Step 9" in Step 3's text — Fernwärme is Step 7; the pool-paradigm checkpoint list said "Steps 4 and 8" — should be "Steps 4 and 6," Step 8 is reintegration, not a pool checkpoint). Added Step 9 — District Musical Theme, per its move into Phase 3 scope, deliberately outside the 23-instrument inventory. Re-ran the Timeline Reality Check reference to 11–13 weeks / mid-to-late October, matching the Project Plan's re-estimate.
**Companion to:** `docs/Technical_Architecture_v5.md` (architecture, interface-contract candidates, open questions), `docs/Project_Plan_v3_5.md` (phase calendar, budget, timeline reality check)

This document is the build plan for Phase 3 of `Project_Plan_v3_5.md`: replacing `src/audio-layers.js` with self-contained instrument modules and HTML control surfaces. It does not repeat the architecture rationale — see the Architecture doc for why this pivot happened and what the interface-contract candidates are.

---

## Instrument Inventory

23 instruments across 6 layers, one per sonic behaviour (see `docs/Technical_Architecture_v5.md` for the granularity decision and how this count was derived). The District 1 musical theme (Step 9 below) is deliberately not counted among these 23 — see that step for why. "Spec" = an archived Max for Live patch exists at `docs/archive/max/patch-inventory.md` documenting its signal chain; "no spec" = the behaviour was added to `audio-layers.js` after the Max patches were authored and has to be built directly from the current JS.

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
2. **Electricity oscillator pool** (#5) — the most conventional of the three existing pool paradigms (persistent claim/release keyed by feature ID, closest to a standard synth voice-allocation pattern), so it's the most representative single pool exemplar to validate the contract against. Deliberately *not* tram's hiss pool or telecom's burst pool here — those are each other's edge cases and are exercised later (see Steps 4 and 6) as checkpoints on whether the contract generalises, not as the first thing it's designed against.

**Also decide during this step, as a single policy applied to all three pool instruments (not per-pool as each is built):** pool-exhaustion behaviour — silent drop vs. nearest-wins swap. This was originally listed as a separate later decision point; folded in here because it's cheaper to answer once, against the electricity pool proof instrument, than to re-litigate it three times (Step 1 electricity, Step 4 tram, Step 6 telecom) or worse, let each inherit whatever the port from `audio-layers.js` happens to do by accident (today: electricity silently drops, telecom has no exhaustion case at all since it never claims per-feature). Whichever policy is chosen, note explicitly in Step 4 and Step 6 whether tram's and telecom's pool *shapes* even have a meaningful equivalent to "exhaustion" — tram's stateless reassignment and telecom's always-on collective gating may not.

**Done means:** interface contract chosen and written up; pool-exhaustion policy decided and documented as part of that write-up; both instruments run standalone through their HTML control surfaces with MIDI input; both instruments, when fed live ProximityEngine output in the app, reproduce the current field-tested sound for that behaviour (not just "sounds plausible in isolation" — actually A/B against the current `audio-layers.js` behaviour on the same walk).

**Decision point (yours) — expanded:** which contract to commit to, and how to decide.

- *What to actually compare once both proof instruments exist, beyond "which felt nicer to write":*
  - **Code volume and duplication** — how much boilerplate repeats across the two instruments under each contract, and how that scales when guessed across all 23 (not just these 2).
  - **Pool-fit** — does the contract's answer for electricity's persistent claim/release generalise cleanly to a *description* of what tram's and telecom's pools would need, even before they're built? If you can't sketch that sketch confidently after Step 1, that's a signal the contract isn't proven yet, regardless of how clean the electricity case looks alone.
  - **Control-surface reusability** — given control surfaces are now authoring-only by default (decision below), does the contract make it easy to build the *next* 21 surfaces faster than the first 2, or does each stay bespoke regardless of contract? A contract that doesn't reduce marginal surface-building cost is worth less than the trade-off tables in the Architecture doc suggest on paper.
  - **Score-archive logging** — how many places would need a hook to log a `.trigger()`/`.update()` call if the score archive (Project Plan, "Walk Recording & Score Archive") gets built later. One interception point is better than 23, but only matters if that feature actually gets built — don't over-weight it if it's still speculative when you're deciding.
  - **Mapping-curve audit fit** — the open mapping-curve audit (Architecture doc) touches all 22 non-crackle instruments. A contract that puts the proximity-to-gain mapping in one legible place (Option B's config) makes that audit mechanically easier than one that scatters it across 22 class bodies (Option A/C) — weigh this if the audit is likely to happen for real rather than stay a someday-item.
- *Process:* build all three for instrument #1 only if telling them apart from the water pulse alone feels ambiguous after a quick pass; otherwise eliminate on the trade-off tables and build only the strongest 1–2 candidates for real, then confirm with the electricity pool. Don't build all three for both proof instruments — that's 6 builds to answer a question 2–3 should settle.

### Step 2 — Electricity layer completion

3. Cable-crossing snap (#6), alongside loop (#7) — both spec'd, both simple one-shot/loop shapes, and doing them immediately after the pool proof keeps the electricity-specific context (density gain, master gain gating) fresh rather than returning to it later.

**Done means:** electricity layer fully on the new architecture, field-validated against baseline.

### Step 3 — Water layer completion

4. Fitting-cluster drip (#2) — spec'd, similar shape to the already-built proximity pulse.
5. Pipe-crossing knock (#3), alongside loop (#4) — **no spec.** This is deliberately the first "build without a Max reference" case, but it's a low-complexity one (single 380Hz tone, one-shot vs. looped-with-jitter variant of the same sound) — a safe place to establish the pattern for translating straight from `audio-layers.js` before doing the same thing for Fernwärme (Step 7), which is sonically more novel.

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

### Step 9 — District Musical Theme

Not one of the 23 instruments (see Architecture doc, "Granularity") — a separate, parallel workstream pulled into Phase 3 scope from indefinite deferral (`docs/Project_Plan_v3_5.md`). Compose a procedural ambient foundation (sustained tones, slow harmonic drift) and iterate against how it sits underneath the six infrastructure layers during an actual walk — the theme supports the layers, not the reverse. Architecturally closer to the shared density reverb bus (something all layers relate to) than to a per-behaviour instrument driven by one layer's proximity data, which is why it isn't in the Instrument Inventory table.

No dependency on Steps 1–8 — it doesn't touch the interface contract, any pool, or `audio-layers.js`, and could in principle be built in parallel with them. Sequenced last here only because it has no risk-sequencing reason to go earlier, not because it's blocked.

**Done means:** theme plays continuously and audibly under the six infrastructure layers on a full field walk without masking them or without being masked by dense multi-layer zones (e.g. Bahnhofstrasse); a listener can articulate that both the theme and the infrastructure layers are present.

---

## Dependencies

- Step 1 hard-blocks Steps 2–7 (can't build 22 more instruments against an undecided contract).
- Steps 2–7 (per-layer) have no dependencies on each other — the order above is a reasoning-based recommendation for risk sequencing, not a technical requirement. They could be reordered or parallelised if more than one person were building, but as a solo effort the sequencing matters for catching contract problems early rather than late.
- Step 8 depends on all of Steps 2–7 being complete.
- Step 9 (district theme) has no dependency on Steps 1–8 and none of them depend on it — it can run in parallel with any of them.
- PWA work (`Project_Plan_v3_5.md` Phase 4, Week 1) no longer has an open dependency on the control-surface shipping question — that's resolved (authoring-only by default, see Decision Points below), so Service Worker caching scope is just the app shell (HTML/JS/GeoJSON) plus any individual control that's later promoted to production. Core app-shell caching could reasonably start before Step 8 finishes; add a promoted control to the cache list only once it's actually promoted.
- User testing (`Project_Plan_v3_5.md` Phase 4, Week 2–3) hard-depends on Step 8 — testing an incomplete rebuild would produce feedback about bugs that are already known and about to be fixed, not useful signal.

---

## Decision Points

Status as of this revision — five of six resolved, one (interface contract itself) sharpened but deliberately left open until the Step 1 prototypes exist.

1. **Interface contract** (Step 1) — **open, expanded above.** Which of the three candidates in `docs/Technical_Architecture_v5.md`, decided against explicit comparison criteria (code volume, pool-fit, control-surface reusability, score-archive logging, mapping-curve-audit fit) after the water pulse and electricity pool are built — not just a gut read of which felt nicer to write.
2. **HTML control surfaces: ship in production or authoring-only?** **Resolved: authoring-only by default.** Build one per instrument as a dev tool for sound design and MIDI-driven auditioning (all 23 still get built — this doesn't reduce Step 1–7 scope). Whether any *specific* control gets promoted into the production UI is decided per-control, later, once it exists and can actually be tried — promote only if there's schedule headroom to harden it for production (mobile-responsive, accessible, no dev-only affordances left in) and the result is one you want end-users to have, not by default. Treat every surface as authoring-only until a specific one earns promotion.
3. **Pool-exhaustion behaviour.** **Resolved: decide early, once, in Step 1** (moved into that step above) rather than per-pool as each pool instrument gets built later — see Step 1 for the full reasoning.
4. **Granularity: 23 per-behaviour modules vs. consolidating toward per-layer instruments.** **Resolved: hold at 23.** No consolidation. The Instrument Inventory table above and the build order both assume this; revisit only if Step 2–3 (the first two real layers) show unmanageable duplication in practice, not pre-emptively.
5. **Timeline trade-off.** **Resolved: accept a slip into October rather than cutting scope to force September.** `docs/Project_Plan_v3_5.md`'s Timeline Reality Check is updated accordingly — the September-specific cut list there is now historical framing, not a live option being weighed. Re-run since that resolution to account for the district theme (Step 9) and PWA groundwork being added to Phase 3 scope: current estimate is **11–13 weeks from 27 July, landing mid-to-late October** (was 10–12 weeks / early-to-mid October before those additions) — see the Project Plan for the accounting.
6. **`max/fernwaerme/fernwaerme-spec.md`, `max/sewage/sewage-spec.md`, `max/README.md`.** **Resolved: superseded-header treatment applied to the fernwärme and sewage specs**, same pattern as `patch-inventory.md`/`TECHNICAL_NOTES.md` — including their Max-era MIDI control-mapping tables (MPK Mini Mk4 CC assignments), which are now historical but remain a useful reference point when designing the new instruments' own MIDI mapping. `circleoffifths.js` is unaffected — it's plain JS, not a Max artifact, and stays live.

---

## Risks

- **Contract doesn't generalise past Step 1's single pool paradigm.** Mitigated by design: Step 4 (tram) and Step 6 (telecom) are explicit checkpoints against the other two pool shapes, placed early enough in the sequence that a bad fit is caught with 2–3 layers built, not 5.
- **HTML control surface scope balloons.** 23 surfaces is a lot of bespoke UI even if each is small — this risk doesn't go away just because they're authoring-only (decision #2); it still takes real time to build 23 of anything. It's mitigated, not eliminated, by not needing production hardening (accessibility, mobile-responsive, no dev-only affordances) on any surface unless and until it's individually promoted — most of them never will be, so most of the 23 stay at "good enough to drive with MIDI" quality, not shipped-product quality.
- **Regression during the rebuild.** Mitigated by not deleting `src/audio-layers.js` until Step 8's parity check passes (see above).
- **Stale data pulled into an instrument's parameters.** `docs/phase2-data-layer.md` has feature counts from an earlier 12-order snapshot; if a radius or count gets copied from there instead of from `docs/Technical_Architecture_v5.md` or live code, it'll be wrong. Source parameters from the architecture doc's tables or the current `src/audio-layers.js`/`src/proximity-engine.js`, not from the data-layer iteration log.
- **District theme undermines rather than supports the layers.** Composing generative ambient music that stays a foundation rather than competing for attention is genuinely hard — see `docs/Project_Plan_v3_5.md`, Risk Mitigation, "Sound Design Risks" for the fuller treatment (start simple, iterate against the layers, a static ambient bed is an acceptable fallback if generative composition underdelivers).
- **Grant-deadline contention.** The Umsetzung und Präsentation application (1 September) sits inside Step 2–6's build window and will take real days away from instrument work — already factored into the Project Plan's Timeline Reality Check, not an unaccounted-for risk, but worth naming here so it isn't forgotten mid-build.
