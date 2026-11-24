/**
 * Standard guitar tuning and note/frequency math, shared by the string
 * model and (in later milestones) the keyboard-to-fret mapping.
 */

/** MIDI note numbers for standard tuning, string 0 = low E ... string 5 = high E. */
export const STANDARD_TUNING = [
  { name: 'E2', midi: 40 },
  { name: 'A2', midi: 45 },
  { name: 'D3', midi: 50 },
  { name: 'G3', midi: 55 },
  { name: 'B3', midi: 59 },
  { name: 'E4', midi: 64 },
];

/**
 * Convert a MIDI note number to frequency in Hz (A4 = MIDI 69 = 440 Hz).
 * @param {number} midiNote
 * @returns {number}
 */
export function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Frequency in Hz for a given string and fret under standard tuning.
 * @param {number} stringIndex - 0 (low E) through 5 (high E).
 * @param {number} fret - 0 = open string.
 * @returns {number}
 */
export function fretToFrequency(stringIndex, fret) {
  const string = STANDARD_TUNING[stringIndex];
  if (!string) {
    throw new RangeError(`stringIndex must be 0-${STANDARD_TUNING.length - 1}, got ${stringIndex}`);
  }
  if (!Number.isInteger(fret) || fret < 0) {
    throw new RangeError(`fret must be a non-negative integer, got ${fret}`);
  }
  return midiToFrequency(string.midi + fret);
}
