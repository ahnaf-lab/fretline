import { seededNoiseBuffer } from './prng.js';

/**
 * Simulate a plucked string using the Karplus-Strong algorithm.
 *
 * A short noise burst is fed through a circular delay line of length
 * N = round(sampleRate / frequency). Each time a sample is read back out,
 * it is averaged with its neighbor and scaled by `decay`, which models the
 * string's energy loss and gives the characteristic plucked-string timbre.
 *
 * Given the same inputs (including `seed`), this always produces bit-identical
 * output: the only randomness comes from the seeded noise burst.
 *
 * @param {object} options
 * @param {number} options.frequency - Fundamental frequency in Hz.
 * @param {number} [options.sampleRate=44100] - Samples per second.
 * @param {number} [options.duration=1.5] - Length of the pluck in seconds.
 * @param {number} [options.decay=0.996] - Per-sample energy retention (0-1); closer to 1 sustains longer.
 * @param {number} [options.seed=1] - Seed for the initial noise excitation.
 * @returns {Float32Array} Simulated samples, nominally in [-1, 1].
 */
export function pluck({
  frequency,
  sampleRate = 44100,
  duration = 1.5,
  decay = 0.996,
  seed = 1,
}) {
  if (!(frequency > 0)) {
    throw new RangeError(`frequency must be positive, got ${frequency}`);
  }
  if (!(sampleRate > 0)) {
    throw new RangeError(`sampleRate must be positive, got ${sampleRate}`);
  }
  if (!(duration > 0)) {
    throw new RangeError(`duration must be positive, got ${duration}`);
  }
  if (!(decay > 0 && decay <= 1)) {
    throw new RangeError(`decay must be in (0, 1], got ${decay}`);
  }

  const delayLength = Math.max(2, Math.round(sampleRate / frequency));
  const delayLine = seededNoiseBuffer(delayLength, seed);

  const totalSamples = Math.round(duration * sampleRate);
  const output = new Float32Array(totalSamples);

  for (let n = 0; n < totalSamples; n++) {
    const index = n % delayLength;
    const nextIndex = (index + 1) % delayLength;
    const current = delayLine[index];
    output[n] = current;
    delayLine[index] = decay * 0.5 * (current + delayLine[nextIndex]);
  }

  return output;
}
