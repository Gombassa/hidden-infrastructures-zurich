┌─────────────────────────────────────────────────┐
│ SUBSTATION TRANSFORMER DRONE                     │
│                                                  │
│ [loadbang]                                       │
│     ↓                                            │
│ [metro 10] ← 10ms update rate                   │
│     ↓                                            │
│ ┌───[pitch drift logic]───┐                     │
│ │  [expr 50 + (sin($f1/1000)*0.4)]  ← slow LFO │
│ │     ↓                                         │
│ │  [s base-freq] ← send to all oscillators     │
│ └──────────────────────────────────────────────┘
│                                                  │
│ ┌───[oscillator stack]────┐                     │
│ │  [r base-freq]                                │
│ │     ↓                                         │
│ │  [osc~] ← 50Hz fundamental                   │
│ │  [*~ 0.8] ← volume                           │
│ │     ↓                                         │
│ │  [r base-freq]                                │
│ │     ↓                                         │
│ │  [* 2] ← double frequency                    │
│ │  [osc~] ← 100Hz harmonic                     │
│ │  [*~ 0.5]                                    │
│ │     ↓                                         │
│ │  [r base-freq]                                │
│ │     ↓                                         │
│ │  [* 3] ← triple                              │
│ │  [osc~] ← 150Hz                              │
│ │  [*~ 0.3]                                    │
│ │     ↓                                         │
│ │  [+~] [+~] ← mix oscillators                 │
│ └──────────────────────────────────────────────┘
│                                                  │
│ ┌───[heavy load pulsing (optional)]────┐        │
│ │  [tgl] ← toggle for testing                  │
│ │     ↓                                         │
│ │  [osc~ 1.5] ← 1.5Hz pulse                    │
│ │  [*~ 0.3]                                    │
│ │  [+~ 1] ← offset to 0.7-1.3 range           │
│ │     ↓                                         │
│ │  [s pulse-mod]                               │
│ └──────────────────────────────────────────────┘
│                                                  │
│ [r pulse-mod]                                    │
│     ↓                                            │
│ [*~] ← apply amplitude modulation               │
│     ↓                                            │
│ [hip~ 30] ← high-pass (remove DC)              │
│     ↓                                            │
│ [*~ 0.3] ← master volume                        │
│     ↓                                            │
│ [dac~] ← audio output                           │
└─────────────────────────────────────────────────┘