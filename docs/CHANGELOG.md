# Changelog

Version history for the project's planning and architecture documents, moved out of their own headers to keep those headers short. Organised newest-first, one section per document, each version as a subsection. Entries are moved verbatim from the source documents, including meta-commentary about what was and wasn't updated and why — that commentary is the point of keeping them.

**Standing instruction:** from this point on, every documentation change adds a new entry here, under the relevant document's section, at the top (newest-first) — not to the document's own header. See `CLAUDE.md`.

---

## Project Plan (`docs/Project_Plan_v3_5.md`)

### v3.5.5

**Changes from v3.5.4 (funding application dead):** The Stadt Zürich Digitale Künste — Umsetzung und Präsentation application was never submitted — its 1 September 2026 deadline has passed with nothing filed, and no external funding is currently being pursued. Removed every place that treated it as pending: the Timeline Reality Check's opening framing (it no longer "consumes real working days"), and both "development continues regardless of funding outcome" lines (Timeline Reality Check and Critical Path), which read as hedging against an outcome that no longer exists — replaced with the settled fact that development proceeds on existing hardware and GCP free/low-cost tiers, not contingent on any application. The Budget section is retitled **historical** (the costed scope as prepared for that application, not current spend) with a leading paragraph stating no application was submitted and none is being pursued; its arithmetic — how CHF 12,819 became CHF 10,700 — is kept intact as the audit trail, not deleted. The June 2026 Ideenfindung und Konzeptentwicklung refusal (ref 2026/KTR 24950, Architecture Decision section) is a separate, earlier event and stays unchanged — it remains the stated rationale for the Max/MSP + RNBO pivot, unaffected by this application's fate.

### v3.5.4

**Changes from v3.5.3 (Steps 6–8 complete, field walk round 1):** Telecom (Step 6) and Fernwärme (Step 7) are fully rebuilt as real instrument classes — all 24 behaviours across all 6 layers are now built, closing out the "only telecom's chirp remains" gap this document previously tracked. `index.html` has been reintegrated onto a new orchestrator (`src/instrument-layers.js`) in place of `audio-layers.js` (Step 8) — but only on the `step-8-reintegration` branch, not `main`; production Cloud Run traffic is unaffected until Step 8's field-walk gate closes. Round 1 of that field walk (2026-09) found the electricity layer too loud overall, fixed with a -9dB trim, redeployed to a separate `--no-traffic` Cloud Run test revision (tagged `step8`) for further rounds. Phase 3's Step 3 checklist below ("Reintegration") is now substantively done in code, pending only that field validation — see `docs/Implementation_Plan.md` v2.1 for the full record. Not re-run here: the Timeline Reality Check's week-accounting, per this document's own convention (see the v3.5.1 changes above) of not inventing derived numbers without a real basis — the remaining unknown is field-walk duration, not build time, which this document isn't positioned to estimate.

### v3.5.3

**Changes from v3.5.2 (progress sync):** Phase 3 Step 1–2 work has actually begun, ahead of and outside the sequencing this document describes: 10 standalone HTML instrument surfaces exist under `instruments/` (see `docs/instrument-reference.html`), covering 22 of a corrected 24-item inventory (was 23 — a new Water Flow continuous-bed behaviour has no prior spec). The interface-contract decision (Step 1) has **not** been formally resolved despite this — see `docs/Implementation_Plan.md` v1.2 and `docs/Technical_Architecture_v5.md` v5.3 for the full detail. Two things this document stated as settled are reopened by that build work: control surfaces are reachable on the deployed URL already (not authoring-only by default, as Step 2 assumed), and the "hold at 23" granularity decision is challenged by `crossing-family.html`'s finding that 8 inventory items are one module with presets, not 8. Also fixes a pre-existing drift between this header (v3.5.2) and the document's own footer (which still read 3.5.1) — both now read v3.5.3.

### v3.5.2

**Changes from v3.5.1 (correction pass):**
- **District musical theme moves into Phase 3 scope**, as its own workstream (not a 24th instrument — inventory stays at 23). Added to Executive Summary, Phase 3 (new "Additional workstream" subsection), Success Criteria (restored), Risk Mitigation ("Sound Design Risks" — theme risk is now live, not deferred), Phase 1's "Dropped from Phase 1" note updated to say it was later un-deferred. Removed its CHF 1,500 budget line entirely (built as regular Phase 3 work instead, not commissioned) — Artistic Development CHF 5,500 → CHF 4,000, grand total CHF 12,200 → **CHF 10,700**; arithmetic shown in the Budget section rather than asserted.
- **PWA groundwork given an actual Phase 3 step** (app-shell Service Worker/Manifest scaffolding), consistent with `Implementation_Plan.md`'s dependency note that this could start before instrument work finishes. Phase 4 Week 1 reframed as completion, not a start-from-scratch week.
- **Old Phase 3 data-expansion carryover items accounted for explicitly** rather than silently dropped: spatial culling confirmed done (verified in `src/proximity-engine.js`); district-boundary coverage and full-scale culling performance folded into Phase 4 field testing as explicit checks (neither was previously verified, despite the old plan implying otherwise); dynamic infrastructure loading dropped as moot (the live map never renders the full dataset); the old Phase 4 UI item reconciled against "Walk Recording & Score Archive" (options page is post-launch, not Phase 3/4) with a light UX pass folded into Week 4 for what's left of it.
- **Instrument count corrected 22 → 21** remaining after the two Step 1 proof instruments, in both places it appeared (Phase 3 Step 1, Timeline Reality Check).
- **Phase 3 relabelled** "late July – early September 2026" (from "August 2026," which never lined up with the Timeline Reality Check's 27 July start).
- **Timeline Reality Check re-run** to account for the theme and PWA-groundwork scope added above: **11–13 weeks** from 27 July (was 10–12), landing **mid-to-late October** (was early-to-mid October). The theme's added time is a flagged estimate (+1 week), not a verified figure — no prior data point exists for it.
- **Phase 1's stale unchecked item removed:** "User testing (3-5 people)" was still listed unresolved on a phase marked Complete; removed and noted as absorbed into Phase 4's testing round instead.
- **GeoShop order count and feature totals corrected**: 30 orders (55297–55476) was already stale against the committed codebase (79 orders) before this pass, and the working tree has since moved to **88 orders (55297–56642)** — corrected throughout (Data Layer, Critical Path, Technical Stack). Total infrastructure features corrected from the long-standing 26,936 figure to the current **83,751** (see `README.md` and `docs/Technical_Architecture_v5.md` for the per-layer breakdown) — this was roughly 3× stale, not a rounding error.
- **Trigger radii range corrected** 25–80m → **5–80m** (5m is the tram trasse drone gate, `POWERLINE_DRONE_RADIUS` in `src/proximity-engine.js`; 80m is sewage) in Risk Mitigation.
- **Budget header** now names the specific application (Digitale Künste — Umsetzung und Präsentation, 1 September 2026 deadline) rather than the generic programme name.
- **Success Criteria changes from v3.5 recorded here for the first time** (they were made without a changelog entry when v3.5 was written): battery-drain (<25% over full exploration) and the "spatial culling handles ~11,000 features" criterion were both dropped from Technical; "15+ user testing participants" was softened to "count per Timeline Reality Check"; "Documented with high-quality video/photos" was dropped from Artistic. Also dropped at that point, without a stated reason and not restored in this pass either — flagging rather than silently continuing to omit: "Tram/water/data events create synchronised experiences," "Free-roam exploration feels natural and compelling," "Stadt Zürich acknowledges project in digital arts context," and "Open-source code enables adaptation to other cities." Only the district-theme criterion has been restored (see above), since only that one was explicitly asked for.
- **Phase 2's detailed step-by-step content** (per-layer audio synthesis specifics, multi-layer integration steps) was moved to `docs/archive/Project_Plan_v3_4.md` when v3.5 was written, replaced with a pointer — noted here since A10 asked for a complete record of what moved where.

### v3.5.1

**Changes from v3.5:** Resolved the Timeline Reality Check's open cut-list — accept a launch slip into October rather than compress scope to hit September. Confirmed control surfaces are built for all 23 instruments but authoring-only by default (not a scope cut), and granularity holds at 23 (not consolidated). Pre-launch testing scope (15 vs. a smaller pilot) remains the one lever still open if October slips further.

### v3.5

**Changes from v3.4:** Dropped Max/MSP + RNBO as the production audio path; browser-native Web Audio instruments (with paired HTML control surfaces) are now the sole production toolchain — see `docs/Technical_Architecture_v5.md` for the architecture and `docs/Implementation_Plan.md` for the build plan. Removed the CHF 619 Max/MSP + RNBO licence line from the budget. Rebased the phase calendar from the stale May/June–August plan to a realistic timeline starting 27 July 2026, and added a plain assessment of what fits before the September 2026 launch target and what doesn't. Updated Technical Stack and Risk Mitigation sections to reflect the toolchain change.

---

## Technical Architecture (`docs/Technical_Architecture_v5.md`)

### v5.4

**Changes from v5.3 (Steps 6–8 complete, field walk round 1):** Telecom (Step 6) and Fernwärme (Step 7) are fully rebuilt as real `src/instruments/*.js` classes — all 24 behaviours across all 6 layers are now built (was 23/24, only telecom's node-entry chirp unbuilt, as of v5.3). `index.html` has been reintegrated onto a new orchestrator, `src/instrument-layers.js`, in place of `audio-layers.js` (Step 8) — but only on the `step-8-reintegration` branch; `audio-layers.js` remains the untouched, field-tested reference and stays what `main`/Cloud Run's production traffic actually serves until a field walk confirms no regression. Round 1 of that field walk (2026-09) found the electricity layer too loud overall; fixed with a -9dB trim at its master gain stage, redeployed to a `--no-traffic`, `step8`-tagged Cloud Run test revision (0% production traffic) for further rounds. See `docs/Implementation_Plan.md` v2.1 for the full record. `docs/Project_Plan_v3_5.md` updated in step.

### v5.3

**Changes from v5.2 (progress sync):** 10 of the 24-item instrument inventory (see below — corrected from 23) now exist as standalone HTML surfaces under `instruments/`, documented in the new companion doc `docs/instrument-reference.html`. Two decisions previously marked resolved in "Open questions — status" are reopened by what that build work found: control-surface production shipping (surfaces are reachable on the deployed URL already, not authoring-only as decided) and granularity (`crossing-family.html` shows 8 of the 24 items are one module with presets, not 8 separate instruments). Behaviour inventory table gains a Water Flow row (#24), a new continuous-bed behaviour with no prior spec. See `docs/Implementation_Plan.md` v1.2 for the full build-status detail this document summarises.

### v5.2

**Changes from v5.1 (correction pass):** Corrected the COEP/COOP justification in Deployment — the correct reason is SharedArrayBuffer/high-resolution-timer cross-origin isolation, not AudioWorklet, and neither is currently used in the codebase, so the headers are retained without an active requirement today. Verified substations are still loaded and emitted (7 files, not 6) — no change needed, a prior assumption that they'd been removed did not hold. Added a note that the District 1 musical theme, now Phase 3 scope, is deliberately not a 24th instrument. Corrected the Data Layer table's feature counts and order count, both roughly 3× stale (26,936 → 83,751 total features; 30 orders/55297–55476 → 88 orders/55297–56642) — counted directly from the current `public/lk-*.geojson` files and `data/processed/.processed-orders.json`, not carried over from prior documents.

### v5.1

**Changes from v5.0:** Resolved four of the five open items from the instrument-architecture section: control surfaces confirmed authoring-only by default (with a per-control promotion path); pool-exhaustion policy moved to be decided once in Phase 3 Step 1 rather than per-pool; granularity confirmed held at 23. Interface contract itself remains open but its decision criteria are now expanded in `docs/Implementation_Plan.md`.

### v5.0

**Changes from v4.0:** Removed Max/MSP + RNBO as the production audio path; documented the pivot decision and rationale. Added Audio Instrument Architecture section: 23-behaviour inventory cross-checked against 19 archived M4L patches, three interface-contract candidates with trade-offs, open questions (control-surface shipping, pool-exhaustion behaviour, mapping-curve audit). Rebased "Future Development Work" off the stale May/June/August phase calendar to point at `Project_Plan_v3_5.md` and the new `Implementation_Plan.md`. Noted `docs/phase2-data-layer.md`'s feature-count staleness without altering that document.
