/**
 * Convert floating-point samples (nominally in [-1, 1]) to signed 16-bit PCM,
 * clamping out-of-range values so a slightly hot signal cannot wrap around.
 * @param {Float32Array|number[]} floatSamples
 * @returns {Int16Array}
 */
export function floatTo16BitPCM(floatSamples) {
  const output = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    output[i] = Math.round(clamped < 0 ? clamped * 32768 : clamped * 32767);
  }
  return output;
}
