Web version: substation-drone-web.pd (switch~ removed for WebPd compatibility)
Compiled: substation-drone-app/patch.wasm
Test page: substation-drone-test.html (also in dual-patch-test.html)

┌────────────────────────────────────────────────┐
│ SUBSTATION TRANSFORMER DRONE                   │
│                                                │
│ [loadbang]                                     │
│     ↓                                          │
│ [metro 10] ← 10ms update rate                  │
│     ↓                                          │
│ ┌───[pitch drift logic]───┐                    │
│ │  [expr 50 + (sin($f1/1000)*0.4)]  ← slow LFO │
│ │     ↓                                        │
│ │  [s base-freq] ← send to all oscillators     │
│ └──────────────────────────────────────────────┘
│                                                │
│ ┌───[oscillator stack]────┐                    │
│ │  [r base-freq]                               │
│ │     ↓                                        │
│ │  [osc~] ← 50Hz fundamental                   │
│ │  [*~ 0.8] ← volume                           │
│ │     ↓                                        │
│ │  [r base-freq]                               │
│ │     ↓                                        │
│ │  [* 2] ← double frequency                    │
│ │  [osc~] ← 100Hz harmonic                     │
│ │  [*~ 0.5]                                    │
│ │     ↓                                        │
│ │  [r base-freq]                               │
│ │     ↓                                        │
│ │  [* 3] ← triple                              │
│ │  [osc~] ← 150Hz                              │
│ │  [*~ 0.3]                                    │
│ │     ↓                                        │
│ │  [+~] [+~] ← mix oscillators                 │
│ └──────────────────────────────────────────────┘
│                                                │
│ ┌───[heavy load pulsing (optional)]────┐       │
│ │  [Trams Nearby] ← number box (0-5)           |
│ │     ↓                                        |
│ │  [s tram-count]                              │  
│ │  [r tram-count]          [r tram-count]      |
│ │     ↓                       ↓                |
│ │  [/ 3]                   [/ 3]               |
│ │     ↓                       ↓                |
│ │  [clip 0 1]              [clip 0 1]          |
│ │     ↓                       ↓                |
│ │  [* 0.5]                 [* 1.5]             |
│ │     ↓                       ↓                |
│ │  [s pulse-depth]         [+ 0.23]            |
│ │                            ↓                 |
│ │                          [s pulse-freq]      |
│ │                                              |
│ │  [r pulse-freq]                              |
│ │     ↓                                        |
│ │  [osc~]                                      |
│ │     ↓                                        |
│ │  [r pulse-depth]                             |
│ │     ↓                                        |
│ │  [*~]                                        |
│ │     ↓                                        |
│ │  [+~ 1]                                      |
│ │     ↓                                        |
│ │  [s~ pulse-mod]   │                          |
│ └──────────────────────────────────────────────┘
│                                                │
│ [r pulse-mod]                                  │
│     ↓                                          │
│ [*~] ← apply amplitude modulation              │
│     ↓                                          │
│ [hip~ 30] ← high-pass (remove DC)              │
│     ↓                                          │
│ [*~ 0.3] ← master volume                       │
│     ↓                                          │
│ [dac~] ← audio output                          │
└────────────────────────────────────────────────┘