import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYBOARD_ROWS, keyToFret, mappedKeys } from '../src/fretboard.js';
import { fretToFrequency, STANDARD_TUNING } from '../src/tuning.js';

test('keyboard has one row per guitar string', () => {
  assert.equal(KEYBOARD_ROWS.length, STANDARD_TUNING.length);
});

test('the first key of the low-E row maps to open string 0', () => {
  const position = keyToFret('z');
  assert.equal(position.stringIndex, 0);
  assert.equal(position.fret, 0);
  assert.equal(position.frequency, fretToFrequency(0, 0));
});

test('fret increases moving right along a row', () => {
  const a = keyToFret('a');
  const s = keyToFret('s');
  const d = keyToFret('d');
  assert.equal(a.fret, 0);
  assert.equal(s.fret, 1);
  assert.equal(d.fret, 2);
  assert.equal(a.stringIndex, s.stringIndex);
  assert.equal(s.stringIndex, d.stringIndex);
});

test('frequency reported for a key matches fretToFrequency for its position', () => {
  const position = keyToFret('p');
  assert.equal(position.frequency, fretToFrequency(position.stringIndex, position.fret));
});

test('unmapped keys return undefined', () => {
  assert.equal(keyToFret('`'), undefined);
  assert.equal(keyToFret(' '), undefined);
});

test('every mapped key is unique', () => {
  const keys = mappedKeys();
  assert.equal(keys.length, new Set(keys).size);
});

test('mappedKeys covers every key referenced in KEYBOARD_ROWS', () => {
  const flattened = KEYBOARD_ROWS.flat();
  const keys = mappedKeys();
  assert.equal(keys.length, flattened.length);
  for (const key of flattened) {
    assert.ok(keys.includes(key), `expected ${key} to be mapped`);
  }
});
