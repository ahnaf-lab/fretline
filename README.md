# fretline

Turn your keyboard into a physically-modeled six-string guitar. Each row of
keys will map to a string and fret; pressing one runs a real Karplus-Strong
plucked-string simulation and renders the note to audio and a tab file.

This repository currently implements the string model and the fretboard
mapping on top of it. A `pluck()` call takes a frequency and a few physical
parameters and returns deterministic PCM samples, as if a single string had
been struck once. The fretboard mapping assigns each of six keyboard rows to
a guitar string and each key's position within its row to a fret, so any key
resolves to a string, fret, and frequency under standard tuning. Live
keyboard capture, real-time audio output, and tab file generation are built
on top of this in later milestones.

## Install

```sh
npm install
```

No runtime dependencies are needed: the simulation, WAV encoding, and CLI
are all built on the Node.js standard library.

## Usage

As a library:

```js
import { pluck, floatTo16BitPCM, writeWavFile, fretToFrequency } from './src/index.js';

const frequency = fretToFrequency(0, 0); // string 0 (low E), fret 0 -> 82.41 Hz
const samples = pluck({ frequency, sampleRate: 44100, duration: 1.5, seed: 1 });
writeWavFile('pluck.wav', floatTo16BitPCM(samples), 44100);
```

The fretboard mapping turns a keyboard key into a string/fret position:

```js
import { keyToFret } from './src/index.js';

keyToFret('a'); // -> { stringIndex: 1, fret: 0, frequency: 110 } (open A string)
```

The grid is six rows of keys, one row per string (low E to high E), with
fret number increasing left to right within a row:

```
z x c v b n m , . /    string 0 (low E),  frets 0-9
a s d f g h j k l ;    string 1 (A)
q w e r t y u i o p    string 2 (D)
1 2 3 4 5 6 7 8 9 0    string 3 (G)
! @ # $ % ^ & * ( )    string 4 (B)
Q W E R T Y U I O P    string 5 (high E)
```

As a CLI, to render a single note to a WAV file:

```sh
node bin/fretline.js --string 0 --fret 0 --out pluck.wav
```

or by keyboard key directly:

```sh
node bin/fretline.js --key a --out pluck.wav
```

Arguments: `--string` (0 = low E ... 5 = high E), `--fret` (0 = open),
`--key` (a mapped keyboard key, overrides `--string`/`--fret`),
`--duration` (seconds), `--decay` (0-1, sustain), `--seed` (integer, for
reproducibility), `--out` (output WAV path).

Run the test suite with:

```sh
npm test
```

## Status

This project is built autonomously, milestone by milestone, and every
milestone is gated on its automated tests passing before it is accepted.
