import test from 'node:test';
import assert from 'node:assert/strict';
import { pluck } from '../src/karplusStrong.js';

test('pluck produces the requested number of samples', () => {
  const samples = pluck({ frequency: 110, sampleRate: 8000, duration: 0.5 });
  assert.equal(samples.length, 4000);
});

test('pluck is deterministic for identical inputs', () => {
  const a = pluck({ frequency: 220, sampleRate: 8000, duration: 0.25, seed: 42 });
  const b = pluck({ frequency: 220, sampleRate: 8000, duration: 0.25, seed: 42 });
  assert.deepEqual(Array.from(a), Array.from(b));
});

test('different seeds produce different output', () => {
  const a = pluck({ frequency: 220, sampleRate: 8000, duration: 0.25, seed: 1 });
  const b = pluck({ frequency: 220, sampleRate: 8000, duration: 0.25, seed: 2 });
  assert.notDeepEqual(Array.from(a), Array.from(b));
});

test('samples stay within the nominal [-1, 1] range', () => {
  const samples = pluck({ frequency: 440, sampleRate: 8000, duration: 1 });
  for (const sample of samples) {
    assert.ok(sample >= -1 && sample <= 1, `sample ${sample} out of range`);
  }
});

test('energy decays over the duration of the pluck', () => {
  const samples = pluck({ frequency: 220, sampleRate: 8000, duration: 1, decay: 0.995 });
  const half = Math.floor(samples.length / 2);
  const rms = (arr) => Math.sqrt(arr.reduce((sum, v) => sum + v * v, 0) / arr.length);
  const firstHalfRms = rms(samples.slice(0, half));
  const secondHalfRms = rms(samples.slice(half));
  assert.ok(secondHalfRms < firstHalfRms, 'expected string energy to decay over time');
});

test('rejects non-positive frequency', () => {
  assert.throws(() => pluck({ frequency: 0 }), RangeError);
  assert.throws(() => pluck({ frequency: -10 }), RangeError);
});
