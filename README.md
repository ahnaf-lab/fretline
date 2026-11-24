# fretline

Turn your keyboard into a physically-modeled six-string guitar. Each row of
keys will map to a string and fret; pressing one runs a real Karplus-Strong
plucked-string simulation and renders the note to audio and a tab file.

This repository currently implements the string model, the fretboard
mapping, and the key-press hooks that connect them. A `pluck()` call takes a
frequency and a few physical parameters and returns deterministic PCM
samples, as if a single string had been struck once. The fretboard mapping
assigns each of six keyboard rows to a guitar string and each key's position
within its row to a fret, so any key resolves to a string, fret, and
frequency under standard tuning. The key-hook layer wires real key presses
to that mapping: each mapped key press plucks its string and mixes the
resulting samples into a session buffer at the moment it was pressed, so
notes struck close together overlap the way they would on a real guitar.
Real-time audio output and tab file generation are built on top of this in
later milestones.

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

Key presses are wired to plucks through `createKeyHandler`, which looks up
the key, plucks the matching string, and mixes the result into a
`SessionBuffer` at the time it was pressed:

```js
import { SessionBuffer, createKeyHandler } from './src/index.js';

const buffer = new SessionBuffer(44100);
const handleKeyPress = createKeyHandler({ buffer });

handleKeyPress('a', 0);   // open A string at t=0s
handleKeyPress('s', 0.3); // A string, fret 1, at t=0.3s -- overlaps the first note's tail

writeWavFile('riff.wav', floatTo16BitPCM(buffer.samples), buffer.sampleRate);
// or: writeFileSync('riff.wav', buffer.toWav());
```

`listenForKeys` attaches that handler to a real keyboard by putting stdin
into raw mode and timestamping each key press against when listening
started; it returns a `stop()` function to detach the listener and restore
the terminal.

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

To record a riff by playing the keyboard live in a terminal:

```sh
node bin/fretline.js play --out riff.wav
```

Every mapped key press plucks its string and mixes it into a growing
session buffer; press Esc or Ctrl+C to stop and write the buffer to
`--out`. `play` accepts the same `--duration`, `--decay`, and `--seed`
options as the single-note form, and requires an interactive terminal
(it mixes to a buffer and writes a WAV file, not live audio playback).

Run the test suite with:

```sh
npm test
```

## Status

This project is built autonomously, milestone by milestone, and every
milestone is gated on its automated tests passing before it is accepted.
