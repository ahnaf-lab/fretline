/**
 * Maps a physical keyboard grid onto a fretboard: each row of keys is one
 * guitar string, and each key's position within its row is the fret number
 * (0 = open string, increasing toward the right).
 */

import { fretToFrequency, STANDARD_TUNING } from './tuning.js';

/**
 * Keyboard rows, ordered low string to high string (string 0 = low E ...
 * string 5 = high E), matching STANDARD_TUNING. Each row supplies up to 10
 * frets (0-9). The bottom two physical rows cover the low strings; the
 * shifted number and QWERTY rows cover the two highest strings so all six
 * rows fit on a standard keyboard without colliding with modifier keys.
 */
export const KEYBOARD_ROWS = [
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
];

if (KEYBOARD_ROWS.length !== STANDARD_TUNING.length) {
  throw new Error('KEYBOARD_ROWS must have one row per string in STANDARD_TUNING');
}

/**
 * Build a lookup table from key character to its fretboard position and
 * frequency. Computed once at module load since the grid is static.
 * @returns {Map<string, { stringIndex: number, fret: number, frequency: number }>}
 */
function buildKeyMap() {
  const map = new Map();
  KEYBOARD_ROWS.forEach((row, stringIndex) => {
    row.forEach((key, fret) => {
      if (map.has(key)) {
        throw new Error(`Duplicate key "${key}" in KEYBOARD_ROWS`);
      }
      map.set(key, { stringIndex, fret, frequency: fretToFrequency(stringIndex, fret) });
    });
  });
  return map;
}

const KEY_MAP = buildKeyMap();

/**
 * Look up the fretboard position and frequency for a single keyboard key.
 * @param {string} key - A single character as it appears in KEYBOARD_ROWS.
 * @returns {{ stringIndex: number, fret: number, frequency: number } | undefined}
 */
export function keyToFret(key) {
  return KEY_MAP.get(key);
}

/**
 * All keys currently mapped to the fretboard.
 * @returns {string[]}
 */
export function mappedKeys() {
  return Array.from(KEY_MAP.keys());
}
