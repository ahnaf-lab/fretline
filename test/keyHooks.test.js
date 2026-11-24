import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeyHandler } from '../src/keyHooks.js';
import { SessionBuffer } from '../src/sessionBuffer.js';
import { fretToFrequency } from '../src/tuning.js';

test('a mapped key plucks its string and mixes it into the buffer', () => {
  const buffer = new SessionBuffer(8000);
  const handleKeyPress = createKeyHandler({ buffer, duration: 0.1 });

  const result = handleKeyPress('z', 0);

  assert.equal(result.stringIndex, 0);
  assert.equal(result.fret, 0);
  assert.equal(result.frequency, fretToFrequency(0, 0));
  assert.ok(buffer.durationSeconds >= 0.1);
  assert.ok(buffer.samples.some((sample) => sample !== 0), 'expected non-silent samples in buffer');
});

test('an unmapped key is ignored and leaves the buffer untouched', () => {
  const buffer = new SessionBuffer(8000);
  const handleKeyPress = createKeyHandler({ buffer, duration: 0.1 });

  const result = handleKeyPress('`', 0);

  assert.equal(result, null);
  assert.equal(buffer.samples.length, 0);
});

test('repeated presses of the same key land at increasing time offsets', () => {
  const buffer = new SessionBuffer(8000);
  const handleKeyPress = createKeyHandler({ buffer, duration: 0.05 });

  handleKeyPress('a', 0);
  const firstLength = buffer.samples.length;
  handleKeyPress('a', 0.2);

  assert.ok(buffer.samples.length > firstLength, 'expected the buffer to grow for the later pluck');
  assert.equal(buffer.samples.length, Math.round(0.2 * 8000) + Math.round(0.05 * 8000));
});

test('repeated presses of the same key get distinct pluck counts', () => {
  const buffer = new SessionBuffer(8000);
  const handleKeyPress = createKeyHandler({ buffer, duration: 0.05 });

  const first = handleKeyPress('a', 0);
  const second = handleKeyPress('a', 0.2);

  assert.equal(first.pluckCount, 1);
  assert.equal(second.pluckCount, 2);
});
