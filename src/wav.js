import { writeFileSync } from 'node:fs';

const HEADER_SIZE = 44;

/**
 * Encode signed 16-bit PCM samples as a mono WAV file buffer.
 * @param {Int16Array} pcmSamples
 * @param {number} sampleRate
 * @returns {Buffer}
 */
export function encodeWav(pcmSamples, sampleRate) {
  const dataSize = pcmSamples.length * 2;
  const buffer = Buffer.alloc(HEADER_SIZE + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');

  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < pcmSamples.length; i++) {
    buffer.writeInt16LE(pcmSamples[i], HEADER_SIZE + i * 2);
  }

  return buffer;
}

/**
 * Write signed 16-bit PCM samples to a WAV file on disk.
 * @param {string} filePath
 * @param {Int16Array} pcmSamples
 * @param {number} sampleRate
 */
export function writeWavFile(filePath, pcmSamples, sampleRate) {
  writeFileSync(filePath, encodeWav(pcmSamples, sampleRate));
}
