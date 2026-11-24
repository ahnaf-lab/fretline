import test from 'node:test';
import assert from 'node:assert/strict';
import { floatTo16BitPCM } from '../src/pcm.js';

test('converts full-scale values to 16-bit extremes', () => {
  const pcm = floatTo16BitPCM(new Float32Array([1, -1, 0]));
  assert.equal(pcm[0], 32767);
  assert.equal(pcm[1], -32768);
  assert.equal(pcm[2], 0);
});

test('clamps out-of-range values instead of wrapping', () => {
  const pcm = floatTo16BitPCM(new Float32Array([2, -2]));
  assert.equal(pcm[0], 32767);
  assert.equal(pcm[1], -32768);
});

test('preserves output length', () => {
  const input = new Float32Array(100).fill(0.1);
  const pcm = floatTo16BitPCM(input);
  assert.equal(pcm.length, 100);
});

test('returns an Int16Array', () => {
  const pcm = floatTo16BitPCM(new Float32Array([0.5]));
  assert.ok(pcm instanceof Int16Array);
});
