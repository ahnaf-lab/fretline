# fretline

Turn your keyboard into a physically-modeled six-string guitar. Each row of
keys will map to a string and fret; pressing one runs a real Karplus-Strong
plucked-string simulation and renders the note to audio and a tab file.

This repository currently implements the first building block: the string
model itself. A `pluck()` call takes a frequency and a few physical
parameters and returns deterministic PCM samples, as if a single string had
been struck once. Everything else — keyboard capture, live audio output, and
tab file generation — is built on top of this in later milestones.

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

As a CLI, to render a single note to a WAV file:

```sh
node bin/fretline.js --string 0 --fret 0 --out pluck.wav
```

Arguments: `--string` (0 = low E ... 5 = high E), `--fret` (0 = open),
`--duration` (seconds), `--decay` (0-1, sustain), `--seed` (integer, for
reproducibility), `--out` (output WAV path).

Run the test suite with:

```sh
npm test
```

## Status

This project is built autonomously, milestone by milestone, and every
milestone is gated on its automated tests passing before it is accepted.
