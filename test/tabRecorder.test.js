import test from 'node:test';
import assert from 'node:assert/strict';
import { TabRecorder, formatTabText, parseTabText, replayEvents } from '../src/tabRecorder.js';
import { createKeyHandler } from '../src/keyHooks.js';
import { SessionBuffer } from '../src/sessionBuffer.js';

test('TabRecorder.events returns recorded events sorted by time', () => {
  const recorder = new TabRecorder();
  recorder.record({ timeSeconds: 0.3, stringIndex: 1, fret: 1 });
  recorder.record({ timeSeconds: 0, stringIndex: 0, fret: 0 });

  const events = recorder.events;

  assert.equal(events.length, 2);
  assert.equal(events[0].timeSeconds, 0);
  assert.equal(events[1].timeSeconds, 0.3);
});

test('TabRecorder.record rejects a negative timestamp', () => {
  const recorder = new TabRecorder();
  assert.throws(() => recorder.record({ timeSeconds: -1, stringIndex: 0, fret: 0 }), RangeError);
});

test('formatTabText produces a parseable header plus one data line per event', () => {
  const events = [
    { timeSeconds: 0, stringIndex: 0, fret: 0 },
    { timeSeconds: 0.5, stringIndex: 1, fret: 2 },
  ];

  const text = formatTabText(events);

  assert.match(text, /^# fretline tab v1/);
  assert.ok(text.includes('0.000000 0 0'));
  assert.ok(text.includes('0.500000 1 2'));
});

test('parseTabText round-trips events written by formatTabText', () => {
  const original = [
    { timeSeconds: 0, stringIndex: 0, fret: 0 },
    { timeSeconds: 0.25, stringIndex: 3, fret: 7 },
    { timeSeconds: 1.1, stringIndex: 5, fret: 9 },
  ];

  const parsed = parseTabText(formatTabText(original));

  assert.deepEqual(parsed, original);
});

test('parseTabText ignores comment and blank lines', () => {
  const text = '# fretline tab v1\n# ascii stuff\n\n0.000000 2 3\n';
  const events = parseTabText(text);

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { timeSeconds: 0, stringIndex: 2, fret: 3 });
});

test('parseTabText rejects a malformed data line', () => {
  assert.throws(() => parseTabText('0.0 1\n'), /Malformed tab line/);
});

test('parseTabText rejects an out-of-range string index', () => {
  assert.throws(() => parseTabText('0.0 9 0\n'), /Invalid string index/);
});

test('replayEvents mixes a pluck for every event into a fresh buffer', () => {
  const events = [
    { timeSeconds: 0, stringIndex: 0, fret: 0 },
    { timeSeconds: 0.2, stringIndex: 1, fret: 0 },
  ];

  const buffer = replayEvents(events, { sampleRate: 8000, duration: 0.1 });

  assert.ok(buffer instanceof SessionBuffer);
  assert.ok(buffer.durationSeconds >= 0.3);
  assert.ok(buffer.samples.some((sample) => sample !== 0), 'expected non-silent samples');
});

test('createKeyHandler logs mapped presses to an attached recorder', () => {
  const buffer = new SessionBuffer(8000);
  const recorder = new TabRecorder();
  const handleKeyPress = createKeyHandler({ buffer, duration: 0.05, recorder });

  handleKeyPress('a', 0);
  handleKeyPress('`', 0.1); // unmapped: must not be recorded
  handleKeyPress('s', 0.2);

  const events = recorder.events;
  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { timeSeconds: 0, stringIndex: 1, fret: 0 });
  assert.deepEqual(events[1], { timeSeconds: 0.2, stringIndex: 1, fret: 1 });
});
