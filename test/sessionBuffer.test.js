import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionBuffer } from '../src/sessionBuffer.js';

test('buffer grows to fit samples mixed in at an offset', () => {
  const buffer = new SessionBuffer(100);
  buffer.mixAt(0.1, new Float32Array([1, 1, 1]));
  assert.equal(buffer.samples.length, 13);
  assert.equal(buffer.durationSeconds, 0.13);
});

test('overlapping mixes add rather than overwrite', () => {
  const buffer = new SessionBuffer(100);
  buffer.mixAt(0, new Float32Array([0.5, 0.5, 0.5]));
  buffer.mixAt(0.01, new Float32Array([0.25, 0.25]));
  assert.equal(buffer.samples[0], 0.5);
  assert.equal(buffer.samples[1], 0.75);
  assert.equal(buffer.samples[2], 0.75);
});

test('toWav encodes the current buffer as a valid WAV', () => {
  const buffer = new SessionBuffer(8000);
  buffer.mixAt(0, new Float32Array([0, 0.5, -0.5]));
  const wav = buffer.toWav();
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(40), buffer.samples.length * 2);
});

test('rejects a negative time offset', () => {
  const buffer = new SessionBuffer(44100);
  assert.throws(() => buffer.mixAt(-1, new Float32Array([0])), RangeError);
});

test('rejects a non-positive sample rate', () => {
  assert.throws(() => new SessionBuffer(0), RangeError);
});
