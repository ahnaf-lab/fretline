#!/usr/bin/env node
/**
 * Minimal CLI around the string model: pluck one note and render it to a
 * WAV file. Live audio output and tab file generation are later milestones;
 * this exercises the simulation and the keyboard-to-fret mapping end to end.
 */
import { pluck, floatTo16BitPCM, writeWavFile, fretToFrequency, keyToFret } from '../src/index.js';

function parseArgs(argv) {
  const args = {
    string: 0,
    fret: 0,
    key: undefined,
    duration: 1.5,
    decay: 0.996,
    seed: 1,
    out: 'pluck.wav',
  };
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
      case 'key':
      case 'out':
        args[key] = value;
        break;
      default:
        throw new Error(`Unknown argument "--${key}"`);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let stringIndex = args.string;
  let fret = args.fret;

  if (args.key !== undefined) {
    const position = keyToFret(args.key);
    if (!position) {
      throw new Error(`Key "${args.key}" is not mapped to any fret`);
    }
    stringIndex = position.stringIndex;
    fret = position.fret;
  }

  const frequency = fretToFrequency(stringIndex, fret);
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

  console.log(`Plucked string ${stringIndex} fret ${fret} (${frequency.toFixed(2)} Hz) -> ${args.out}`);
}

main();
