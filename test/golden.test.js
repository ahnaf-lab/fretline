import test from 'node:test';
import assert from 'node:assert/strict';
import { pluck } from '../src/karplusStrong.js';
import { SessionBuffer } from '../src/sessionBuffer.js';
import { TabRecorder, formatTabText, parseTabText, replayEvents } from '../src/tabRecorder.js';

/** Round every sample to 8 decimal places so float formatting noise can't fail the comparison. */
function rounded(samples) {
  return Array.from(samples).map((sample) => Number(sample.toFixed(8)));
}

test('pluck produces exact samples for a fixed short pluck, including the wrapped feedback tail', () => {
  // delayLength = round(4000 / 500) = 8, duration gives 12 samples, so the
  // last 4 samples exercise the delay-line wraparound and decay/averaging,
  // not just the raw noise burst.
  const samples = pluck({ frequency: 500, sampleRate: 4000, duration: 0.003, decay: 0.9, seed: 3 });

  assert.deepEqual(rounded(samples), [
    0.44045356, -0.92267567, -0.08761562, -0.85014397, 0.52601075, -0.03763916,
    -0.02654085, -0.67639887, -0.21699995, -0.45463109, -0.42199183, -0.14585994,
  ]);
});

test('a fixed sequence of two overlapping plucks mixes into exact session buffer samples', () => {
  const buffer = new SessionBuffer(4000);
  const first = pluck({ frequency: 500, sampleRate: 4000, duration: 0.002, decay: 0.9, seed: 3 });
  const second = pluck({ frequency: 500, sampleRate: 4000, duration: 0.002, decay: 0.9, seed: 4 });

  buffer.mixAt(0, first);
  buffer.mixAt(0.00125, second); // offset by 5 samples: tails overlap, like two quick strums

  assert.deepEqual(rounded(buffer.samples), [
    0.44045356, -0.92267567, -0.08761562, -0.85014397, 0.52601075, 0.80963326,
    -0.36044908, -1.23306298, -0.83631796, -0.53200549, 0.01699371, -0.84521705,
    0.94772387,
  ]);
});

test('formatTabText produces the exact expected tab file text for a fixed event sequence', () => {
  const events = [
    { timeSeconds: 0, stringIndex: 1, fret: 0 },
    { timeSeconds: 0.25, stringIndex: 1, fret: 2 },
    { timeSeconds: 0.5, stringIndex: 3, fret: 0 },
  ];

  const text = formatTabText(events);

  assert.equal(
    text,
    '# fretline tab v1\n' +
      '# string_index 0 = low E ... 5 = high E; fret 0 = open string\n' +
      '# ascii preview (quantized):\n' +
      '# E|---|\n' +
      '# B|---|\n' +
      '# G|--0|\n' +
      '# D|---|\n' +
      '# A|02-|\n' +
      '# E|---|\n' +
      '#\n' +
      '# columns: time_seconds string_index fret\n' +
      '0.000000 1 0\n' +
      '0.250000 1 2\n' +
      '0.500000 3 0\n',
  );
});

test('a recorded session round-trips through tab text and replays to the exact same audio', () => {
  const recorder = new TabRecorder();
  recorder.record({ timeSeconds: 0.1, stringIndex: 0, fret: 0 });
  recorder.record({ timeSeconds: 0, stringIndex: 1, fret: 3 });
  recorder.record({ timeSeconds: 0.2, stringIndex: 2, fret: 5 });

  const tabText = recorder.toTabText();
  const parsedEvents = parseTabText(tabText);

  // The tab format only stores string/fret/time, so parsing it back must
  // recover exactly the events that were recorded (sorted by time).
  assert.deepEqual(parsedEvents, recorder.events);

  const replayOptions = { sampleRate: 8000, duration: 0.05, decay: 0.95, seed: 10 };
  const replayedFromParsed = replayEvents(parsedEvents, replayOptions);
  const replayedDirectly = replayEvents(recorder.events, replayOptions);

  // And replaying the parsed tab must reproduce bit-identical audio to
  // replaying the original events directly: nothing is lost in the round trip.
  assert.deepEqual(rounded(replayedFromParsed.samples), rounded(replayedDirectly.samples));
  assert.ok(replayedFromParsed.samples.some((sample) => sample !== 0), 'expected non-silent replayed audio');
});
