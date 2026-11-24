#!/usr/bin/env node
/**
 * Minimal CLI around the string model: pluck one note and render it to a
 * WAV file. The keyboard-to-fret mapping and live audio output are later
 * milestones; this just exercises the simulation end to end.
 */
import { pluck, floatTo16BitPCM, writeWavFile, fretToFrequency } from '../src/index.js';

function parseArgs(argv) {
  const args = { string: 0, fret: 0, duration: 1.5, decay: 0.996, seed: 1, out: 'pluck.wav' };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (!key || value === undefined) {
      throw new Error(`Missing value for argument "${argv[i]}"`);
    }
    switch (key) {
      case 'string':
      case 'fret':
      case 'seed':
        args[key] = Number.parseInt(value, 10);
        break;
      case 'duration':
      case 'decay':
        args[key] = Number.parseFloat(value);
        break;
      case 'out':
        args.out = value;
        break;
      default:
        throw new Error(`Unknown argument "--${key}"`);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const frequency = fretToFrequency(args.string, args.fret);
  const sampleRate = 44100;

  const samples = pluck({
    frequency,
    sampleRate,
    duration: args.duration,
    decay: args.decay,
    seed: args.seed,
  });
  const pcm = floatTo16BitPCM(samples);
  writeWavFile(args.out, pcm, sampleRate);

  console.log(`Plucked string ${args.string} fret ${args.fret} (${frequency.toFixed(2)} Hz) -> ${args.out}`);
}

main();
