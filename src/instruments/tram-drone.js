// tram-drone.js — Phase 3 instrument #10 (Step 4).
// Ported from src/audio-layers.js's _initTramElectrical (drone portion) and
// its update() call site (~lines 213-259, 866-878 at the time of porting),
// strict parity — no redesign here, unlike this step's hiss pool. See
// docs/Implementation_Plan.md Step 4.
//
// No spatialization — production's drone is dry/mono, unlike feeder crackle
// and the hiss pool. Its only sense of space is the optional shared
// reverbBus send (fix/single-reverb-bus: the drone's own private convolver
// was removed so the shared density reverb bus, src/instrument-layers.js's
// _reverbBus, is the only reverb in the app).

import { Instrument } from './instrument-base.js';

const DRONE_LFO_RATE_1 = 0.017; // Hz
const DRONE_LFO_RATE_2 = 0.023; // Hz
const DRONE_LFO_DEPTH  = 8;     // Hz — +/-8Hz sweep around centre frequency

export default class TramDrone extends Instrument {
  constructor(ctx, outputNode, { reverbBus } = {}) {
    super(ctx, outputNode);

    this._osc1 = ctx.createOscillator();
    this._osc2 = ctx.createOscillator();
    this._osc1.frequency.value = 110;
    this._osc2.frequency.value = 112;

    this._lfo1 = ctx.createOscillator();
    this._lfoGain1 = ctx.createGain();
    this._lfo1.type = 'sine';
    this._lfo1.frequency.value = DRONE_LFO_RATE_1;
    this._lfoGain1.gain.value = DRONE_LFO_DEPTH;
    this._lfo1.connect(this._lfoGain1);
    this._lfoGain1.connect(this._osc1.frequency);

    this._lfo2 = ctx.createOscillator();
    this._lfoGain2 = ctx.createGain();
    this._lfo2.type = 'sine';
    this._lfo2.frequency.value = DRONE_LFO_RATE_2;
    this._lfoGain2.gain.value = DRONE_LFO_DEPTH;
    this._lfo2.connect(this._lfoGain2);
    this._lfoGain2.connect(this._osc2.frequency);

    this._droneGain = ctx.createGain();
    this._droneGain.gain.value = 0;

    this._osc1.connect(this._droneGain);
    this._osc2.connect(this._droneGain);
    this._droneGain.connect(outputNode);
    if (reverbBus) this._droneGain.connect(reverbBus);

    this._osc1.start();
    this._osc2.start();
    this._lfo1.start();
    this._lfo2.start();

    this._track(this._osc1);
    this._track(this._osc2);
    this._track(this._lfo1);
    this._track(this._lfo2);
  }

  // { nearestPowerlineDist }
  update({ nearestPowerlineDist }) {
    const t = this.ctx.currentTime;
    let target;
    if (nearestPowerlineDist === null || nearestPowerlineDist > 20) target = 0;
    else if (nearestPowerlineDist <= 5) target = 0.3;
    else target = 0.01 + (20 - nearestPowerlineDist) / 15 * (0.3 - 0.01);
    this._droneGain.gain.setTargetAtTime(target, t, 2.0);
  }

  destroy() {
    // 2.0s ramp time-constant needs a longer tail than the base default (0.3s)
    // to actually reach silence before nodes stop.
    this._teardown(this._droneGain, 2.5);
  }
}
