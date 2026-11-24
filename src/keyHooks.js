/**
 * Pure key-press handling: looks up a key's fretboard position, plucks the
 * string, and mixes the resulting samples into a session buffer. Kept
 * separate from the actual stdin wiring in keyListener.js so it can be
 * exercised directly in tests without a real terminal.
 */

import { pluck } from './karplusStrong.js';
import { keyToFret } from './fretboard.js';

/**
 * Build a handler that plucks a string and mixes it into `buffer` each time
 * it is called with a mapped key.
 * @param {object} options
 * @param {import('./sessionBuffer.js').SessionBuffer} options.buffer - Target session buffer.
 * @param {number} [options.duration=1.5] - Pluck duration in seconds.
 * @param {number} [options.decay=0.996] - Pluck decay (0-1).
 * @param {number} [options.seed=1] - Base seed; each pluck advances it so repeated
 *   strikes of the same key are not bit-identical noise bursts.
 * @returns {(key: string, timeSeconds: number) => (object|null)} Handler that returns
 *   the plucked position plus pluck count, or null if the key is unmapped.
 */
export function createKeyHandler({ buffer, duration = 1.5, decay = 0.996, seed = 1 } = {}) {
  if (!buffer) {
    throw new Error('createKeyHandler requires a session buffer');
  }
  let pluckCount = 0;

  return function handleKeyPress(key, timeSeconds) {
    const position = keyToFret(key);
    if (!position) {
      return null;
    }

    pluckCount += 1;
    const samples = pluck({
      frequency: position.frequency,
      sampleRate: buffer.sampleRate,
      duration,
      decay,
      seed: seed + pluckCount - 1,
    });
    buffer.mixAt(timeSeconds, samples);

    return { ...position, key, timeSeconds, pluckCount };
  };
}
