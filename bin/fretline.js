#!/usr/bin/env node
/**
 * CLI around the string model. Two commands:
 *   fretline pluck ...  render a single note to a WAV file (default command)
 *   fretline play ...   listen for key presses and record a riff to a WAV file
 * Real-time audio output and tab file generation are later milestones.
 */
import { writeFileSync } from 'node:fs';
import {
  pluck,
  floatTo16BitPCM,
  writeWavFile,
  fretToFrequency,
  keyToFret,
  SessionBuffer,
  createKeyHandler,
  listenForKeys,
  mappedKeys,
} from '../src/index.js';

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

function parsePlayArgs(argv) {
  const args = { duration: 1.5, decay: 0.996, seed: 1, out: 'session.wav' };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (!key || value === undefined) {
      throw new Error(`Missing value for argument "${argv[i]}"`);
    }
    switch (key) {
      case 'seed':
        args[key] = Number.parseInt(value, 10);
        break;
      case 'duration':
      case 'decay':
        args[key] = Number.parseFloat(value);
        break;
      case 'out':
        args[key] = value;
        break;
      default:
        throw new Error(`Unknown argument "--${key}"`);
    }
  }
  return args;
}

function runPluck(argv) {
  const args = parseArgs(argv);
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

function runPlay(argv) {
  if (!process.stdin.isTTY) {
    throw new Error('fretline play requires an interactive terminal (stdin is not a TTY)');
  }

  const args = parsePlayArgs(argv);
  const sampleRate = 44100;
  const buffer = new SessionBuffer(sampleRate);
  const handleKeyPress = createKeyHandler({
    buffer,
    duration: args.duration,
    decay: args.decay,
    seed: args.seed,
  });

  console.log(`fretline: play a riff across ${mappedKeys().length} mapped keys. Press Esc or Ctrl+C to stop and save to ${args.out}.`);

  function save() {
    writeFileSync(args.out, buffer.toWav());
    console.log(`\nSaved ${buffer.durationSeconds.toFixed(2)}s of audio -> ${args.out}`);
    process.exit(0);
  }

  listenForKeys(
    (key, timeSeconds) => {
      const result = handleKeyPress(key, timeSeconds);
      if (result) {
        console.log(`string ${result.stringIndex} fret ${result.fret} (${result.frequency.toFixed(2)} Hz)`);
      }
    },
    { onExit: save },
  );
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'play') {
    runPlay(rest);
  } else if (command === 'pluck') {
    runPluck(rest);
  } else {
    runPluck(process.argv.slice(2));
  }
}

main();
