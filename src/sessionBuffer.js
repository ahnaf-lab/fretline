/**
 * A growing audio buffer that plucked notes get mixed into over the course
 * of a session, so that notes struck while an earlier note is still decaying
 * overlap naturally instead of cutting each other off.
 */

import { floatTo16BitPCM } from './pcm.js';
import { encodeWav } from './wav.js';

export class SessionBuffer {
  /**
   * @param {number} sampleRate - Samples per second.
   */
  constructor(sampleRate) {
    if (!(sampleRate > 0)) {
      throw new RangeError(`sampleRate must be positive, got ${sampleRate}`);
    }
    this.sampleRate = sampleRate;
    this.samples = new Float32Array(0);
  }

  /** Length of the buffer so far, in seconds. */
  get durationSeconds() {
    return this.samples.length / this.sampleRate;
  }

  /**
   * Additively mix a chunk of samples into the buffer starting at
   * `timeSeconds`, growing the buffer first if the chunk extends past its
   * current end.
   * @param {number} timeSeconds - Offset from the start of the session.
   * @param {Float32Array} samples
   */
  mixAt(timeSeconds, samples) {
    if (!(timeSeconds >= 0)) {
      throw new RangeError(`timeSeconds must be non-negative, got ${timeSeconds}`);
    }
    const startIndex = Math.round(timeSeconds * this.sampleRate);
    const requiredLength = startIndex + samples.length;
    if (requiredLength > this.samples.length) {
      const grown = new Float32Array(requiredLength);
      grown.set(this.samples);
      this.samples = grown;
    }
    for (let i = 0; i < samples.length; i++) {
      this.samples[startIndex + i] += samples[i];
    }
  }

  /** Encode the accumulated buffer as a WAV file buffer. */
  toWav() {
    return encodeWav(floatTo16BitPCM(this.samples), this.sampleRate);
  }
}
