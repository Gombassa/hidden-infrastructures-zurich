// sewage-chords.js — Phase 3, Step 5 support module for sewage-gurgle.js.
// ES port of max/sewage/circleoffifths.js's chord table and bang()/nextChord()
// logic. That file has no `export` and depends on Max's js-object globals
// (`inlets`, `outlets`, `outlet()`) — there is nothing importable in it as
// written, so a browser-usable module is unavoidable here. Per
// docs/Implementation_Plan.md Step 5 ("wired in as-is, not reimplemented"),
// this keeps the chord table, sequence-length range (7-16), random-draw-from-
// chord-voices, and nextChord()'s random-direction drift logically identical
// to the original — max/sewage/circleoffifths.js is left untouched as the
// cited algorithmic source, same convention every other src/instruments/*.js
// file uses for its audio-layers.js source.

const CHORD_NAMES = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

const CHORD_NOTES = [
  [45, 48, 52, 57, 60, 64], // Am
  [40, 43, 47, 52, 55, 59], // Em
  [35, 38, 42, 47, 50, 54], // Bm
  [42, 45, 49, 54, 57, 61], // F#m
  [37, 40, 44, 49, 52, 56], // C#m
  [44, 47, 51, 56, 59, 63], // G#m
  [39, 42, 46, 51, 54, 58], // Ebm
  [34, 37, 41, 46, 49, 53], // Bbm
  [41, 44, 48, 53, 56, 60], // Fm
  [36, 39, 43, 48, 51, 55], // Cm
  [43, 46, 50, 55, 58, 62], // Gm
  [38, 41, 45, 50, 53, 57], // Dm
];

export default class CircleOfFifths {
  constructor() {
    this._currentChord = 0;
    this._sequence = [];
    this._seqPos = 0;
    this._chordName = CHORD_NAMES[0];
    this._generateSequence();
  }

  _generateSequence() {
    const len = 7 + Math.floor(Math.random() * 10);
    const notes = CHORD_NOTES[this._currentChord];
    this._sequence = [];
    for (let i = 0; i < len; i++) {
      this._sequence.push(notes[Math.floor(Math.random() * notes.length)]);
    }
    this._seqPos = 0;
    this._chordName = CHORD_NAMES[this._currentChord];
  }

  _nextChord() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    this._currentChord = (this._currentChord + dir + 12) % 12;
    this._generateSequence();
  }

  // Ports bang() — advances the sequence by one step, returning the note
  // that would have gone to outlet 0 and the chord name (outlet 1, only
  // meaningfully "new" when chordChanged is true).
  bang() {
    let chordChanged = false;
    if (this._seqPos >= this._sequence.length) {
      this._nextChord();
      chordChanged = true;
    }
    const note = this._sequence[this._seqPos];
    this._seqPos++;
    return { note, chordName: this._chordName, chordChanged };
  }

  get chordName() {
    return this._chordName;
  }
}
