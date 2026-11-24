import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeWav } from '../src/wav.js';

test('wav buffer has RIFF/WAVE markers and correct data size', () => {
  const pcm = new Int16Array([0, 100, -100, 32767, -32768]);
  const buffer = encodeWav(pcm, 44100);

  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WAVE');
  assert.equal(buffer.readUInt32LE(40), pcm.length * 2);
  assert.equal(buffer.length, 44 + pcm.length * 2);
});

test('sample rate is written into the fmt chunk', () => {
  const pcm = new Int16Array([1, 2, 3]);
  const buffer = encodeWav(pcm, 22050);
  assert.equal(buffer.readUInt32LE(24), 22050);
});
