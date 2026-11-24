/**
 * Records the sequence of plucks played during a session as a tab file:
 * a human-readable ASCII tab preview followed by an exact, timestamped
 * event log that can be parsed back and replayed note-for-note.
 */

import { STANDARD_TUNING, fretToFrequency } from './tuning.js';
import { pluck } from './karplusStrong.js';
import { SessionBuffer } from './sessionBuffer.js';

const MAX_ASCII_COLUMNS = 400;

/**
 * Render a six-line ASCII tab preview, high string on top (matching
 * conventional tab notation), one character per time column.
 * @param {{timeSeconds: number, stringIndex: number, fret: number}[]} sortedEvents
 * @param {number} columnSeconds - Width of one ASCII column, in seconds.
 * @returns {string[]} One line per string, highest string first.
 */
function renderAsciiTab(sortedEvents, columnSeconds) {
  const maxTime = sortedEvents.reduce((max, event) => Math.max(max, event.timeSeconds), 0);
  const columns = Math.min(MAX_ASCII_COLUMNS, Math.max(1, Math.round(maxTime / columnSeconds) + 1));
  const rows = STANDARD_TUNING.map(() => new Array(columns).fill('-'));

  for (const event of sortedEvents) {
    const column = Math.round(event.timeSeconds / columnSeconds);
    if (column < columns) {
      rows[event.stringIndex][column] = String(event.fret % 10);
    }
  }

  const highToLow = [...rows.keys()].sort((a, b) => b - a);
  return highToLow.map((stringIndex) => `${STANDARD_TUNING[stringIndex].name[0]}|${rows[stringIndex].join('')}|`);
}

/**
 * Format recorded pluck events as a tab file: a commented ASCII preview
 * followed by exact `time string fret` lines, one per event, sorted by time.
 * @param {{timeSeconds: number, stringIndex: number, fret: number}[]} events
 * @param {object} [options]
 * @param {number} [options.columnSeconds=0.25] - ASCII preview column width, in seconds.
 * @returns {string}
 */
export function formatTabText(events, { columnSeconds = 0.25 } = {}) {
  const sorted = [...events].sort((a, b) => a.timeSeconds - b.timeSeconds);
  const lines = [
    '# fretline tab v1',
    '# string_index 0 = low E ... 5 = high E; fret 0 = open string',
    '# ascii preview (quantized):',
    ...renderAsciiTab(sorted, columnSeconds).map((line) => `# ${line}`),
    '#',
    '# columns: time_seconds string_index fret',
  ];
  for (const event of sorted) {
    lines.push(`${event.timeSeconds.toFixed(6)} ${event.stringIndex} ${event.fret}`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Parse a tab file produced by `formatTabText` (or `TabRecorder.toTabText`)
 * back into its pluck events, ignoring comment and blank lines.
 * @param {string} text
 * @returns {{timeSeconds: number, stringIndex: number, fret: number}[]}
 */
export function parseTabText(text) {
  const events = [];
  const lines = text.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length !== 3) {
      throw new Error(`Malformed tab line: "${line}"`);
    }
    const timeSeconds = Number.parseFloat(parts[0]);
    const stringIndex = Number.parseInt(parts[1], 10);
    const fret = Number.parseInt(parts[2], 10);
    if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
      throw new Error(`Invalid time in tab line: "${line}"`);
    }
    if (!Number.isInteger(stringIndex) || stringIndex < 0 || stringIndex >= STANDARD_TUNING.length) {
      throw new Error(`Invalid string index in tab line: "${line}"`);
    }
    if (!Number.isInteger(fret) || fret < 0) {
      throw new Error(`Invalid fret in tab line: "${line}"`);
    }
    events.push({ timeSeconds, stringIndex, fret });
  }
  return events;
}

/**
 * Replay a parsed pluck sequence into a fresh SessionBuffer, re-running the
 * string model for each event at its original timestamp.
 * @param {{timeSeconds: number, stringIndex: number, fret: number}[]} events
 * @param {object} [options]
 * @param {number} [options.sampleRate=44100]
 * @param {number} [options.duration=1.5] - Pluck duration in seconds.
 * @param {number} [options.decay=0.996] - Pluck decay (0-1).
 * @param {number} [options.seed=1] - Base seed; advances per event, matching createKeyHandler.
 * @returns {SessionBuffer}
 */
export function replayEvents(events, { sampleRate = 44100, duration = 1.5, decay = 0.996, seed = 1 } = {}) {
  const buffer = new SessionBuffer(sampleRate);
  events.forEach((event, index) => {
    const frequency = fretToFrequency(event.stringIndex, event.fret);
    const samples = pluck({ frequency, sampleRate, duration, decay, seed: seed + index });
    buffer.mixAt(event.timeSeconds, samples);
  });
  return buffer;
}

/**
 * Accumulates pluck events during a session so they can be written out as a
 * tab file afterwards. Pure bookkeeping: no file I/O, so it can be driven
 * directly from `createKeyHandler` and tested without touching disk.
 */
export class TabRecorder {
  constructor() {
    this._events = [];
  }

  /**
   * Log one pluck event.
   * @param {{timeSeconds: number, stringIndex: number, fret: number}} event
   */
  record({ timeSeconds, stringIndex, fret }) {
    if (!(timeSeconds >= 0)) {
      throw new RangeError(`timeSeconds must be non-negative, got ${timeSeconds}`);
    }
    this._events.push({ timeSeconds, stringIndex, fret });
    return this;
  }

  /** Recorded events, sorted by time. */
  get events() {
    return [...this._events].sort((a, b) => a.timeSeconds - b.timeSeconds);
  }

  /**
   * Render the recorded session as tab-file text.
   * @param {object} [options] - See `formatTabText`.
   * @returns {string}
   */
  toTabText(options) {
    return formatTabText(this._events, options);
  }
}
