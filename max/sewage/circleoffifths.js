inlets = 1;
outlets = 2;

var chords = {
    names: ['Am','Em','Bm','F#m','C#m','G#m','Ebm','Bbm','Fm','Cm','Gm','Dm'],
    notes: [
        [45,48,52,57,60,64], // Am: A2 C3 E3 A3 C4 E4
        [40,43,47,52,55,59], // Em: E2 G2 B2 E3 G3 B3
        [35,38,42,47,50,54], // Bm: B1 D2 F#2 B2 D3 F#3
        [42,45,49,54,57,61], // F#m: F#2 A2 C#3 F#3 A3 C#4
        [37,40,44,49,52,56], // C#m: C#2 E2 G#2 C#3 E3 G#3
        [44,47,51,56,59,63], // G#m: G#2 B2 D#3 G#3 B3 D#4
        [39,42,46,51,54,58], // Ebm: Eb2 Gb2 Bb2 Eb3 Gb3 Bb3
        [34,37,41,46,49,53], // Bbm: Bb1 Db2 F2 Bb2 Db3 F3
        [41,44,48,53,56,60], // Fm: F2 Ab2 C3 F3 Ab3 C4
        [36,39,43,48,51,55], // Cm: C2 Eb2 G2 C3 Eb3 G3
        [43,46,50,55,58,62], // Gm: G2 Bb2 D3 G3 Bb3 D4
        [38,41,45,50,53,57]  // Dm: D2 F2 A2 D3 F3 A3
    ]
};

var currentChord = 0;
var sequence = [];
var seqPos = 0;

function generateSequence() {
    var len = 7 + Math.floor(Math.random() * 10);
    var notes = chords.notes[currentChord];
    sequence = [];
    for (var i = 0; i < len; i++) {
        sequence.push(notes[Math.floor(Math.random() * notes.length)]);
    }
    seqPos = 0;
    outlet(1, chords.names[currentChord]);
}

function nextChord() {
    var dir = Math.random() < 0.5 ? 1 : -1;
    currentChord = (currentChord + dir + 12) % 12;
    generateSequence();
}

function bang() {
    if (seqPos >= sequence.length) {
        nextChord();
    }
    outlet(0, sequence[seqPos]);
    seqPos++;
}

generateSequence();
