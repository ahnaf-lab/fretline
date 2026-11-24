import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { listenForKeys } from '../src/keyListener.js';

function fakeStream() {
  const stream = new EventEmitter();
  stream.isTTY = false;
  return stream;
}

test('key presses are forwarded with an elapsed time since listening started', () => {
  const stream = fakeStream();
  const received = [];
  let clock = 1000;

  listenForKeys((key, timeSeconds) => received.push({ key, timeSeconds }), {
    input: stream,
    now: () => clock,
  });

  clock = 1500;
  stream.emit('keypress', 'a', { name: 'a' });

  assert.equal(received.length, 1);
  assert.equal(received[0].key, 'a');
  assert.equal(received[0].timeSeconds, 0.5);
});

test('Ctrl+C stops listening and calls onExit instead of onKey', () => {
  const stream = fakeStream();
  const received = [];
  let exited = false;

  listenForKeys((key) => received.push(key), {
    input: stream,
    now: () => 0,
    onExit: () => {
      exited = true;
    },
  });

  stream.emit('keypress', undefined, { name: 'c', ctrl: true });

  assert.equal(exited, true);
  assert.equal(received.length, 0);
});

test('stop() detaches the listener so further key presses are ignored', () => {
  const stream = fakeStream();
  const received = [];

  const stop = listenForKeys((key) => received.push(key), { input: stream, now: () => 0 });
  stop();
  stream.emit('keypress', 'a', { name: 'a' });

  assert.equal(received.length, 0);
});
