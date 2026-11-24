import test from 'node:test';
import assert from 'node:assert/strict';
import { midiToFrequency, fretToFrequency, STANDARD_TUNING } from '../src/tuning.js';

test('A4 (MIDI 69) is 440 Hz', () => {
  assert.equal(midiToFrequency(69), 440);
});

test('open low E string is approximately 82.41 Hz', () => {
  const freq = fretToFrequency(0, 0);
  assert.ok(Math.abs(freq - 82.41) < 0.01, `expected ~82.41, got ${freq}`);
});

test('fretting 12 semitones up doubles the frequency', () => {
  const open = fretToFrequency(0, 0);
  const octaveUp = fretToFrequency(0, 12);
  assert.ok(Math.abs(octaveUp - open * 2) < 1e-9);
});

test('standard tuning has six strings', () => {
  assert.equal(STANDARD_TUNING.length, 6);
});

test('rejects out-of-range string index', () => {
  assert.throws(() => fretToFrequency(6, 0), RangeError);
  assert.throws(() => fretToFrequency(-1, 0), RangeError);
});

test('rejects negative fret', () => {
  assert.throws(() => fretToFrequency(0, -1), RangeError);
});
