/**
 * Deterministic pseudo-random number generator (mulberry32).
 *
 * The string model needs a noise source for the initial pluck excitation.
 * Using Math.random() would make every pluck different even for identical
 * input, which breaks the "deterministic PCM samples per pluck" requirement.
 * Seeding this generator with an integer makes the entire simulation
 * reproducible.
 */

/**
 * Create a seeded random number generator.
 * @param {number} seed - 32-bit integer seed.
 * @returns {() => number} Function returning floats in [0, 1).
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fill a Float64Array of the given length with noise in [-1, 1), using a
 * freshly seeded generator so the result depends only on `seed` and `length`.
 * @param {number} length
 * @param {number} seed
 * @returns {Float64Array}
 */
export function seededNoiseBuffer(length, seed) {
  const rng = createRng(seed);
  const buffer = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = rng() * 2 - 1;
  }
  return buffer;
}
