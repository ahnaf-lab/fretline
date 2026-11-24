/**
 * Wires real keyboard input to a key-press callback. Isolated from
 * keyHooks.js so the actual stdin/raw-mode plumbing can be swapped out for a
 * fake stream in tests, while the pluck-and-mix logic stays pure.
 */

import readline from 'node:readline';

/**
 * Start listening for key presses on `input`, calling `onKey(key, elapsedSeconds)`
 * for every key pressed after listening begins.
 * @param {(key: string, elapsedSeconds: number) => void} onKey
 * @param {object} [options]
 * @param {NodeJS.ReadStream} [options.input=process.stdin]
 * @param {() => number} [options.now=Date.now] - Clock used to timestamp key presses.
 * @param {() => void} [options.onExit] - Called when Ctrl+C or Escape is pressed.
 * @returns {() => void} Stop function that detaches the listener and restores raw mode.
 */
export function listenForKeys(onKey, { input = process.stdin, now = Date.now, onExit } = {}) {
  readline.emitKeypressEvents(input);
  const wasRaw = input.isTTY ? input.isRaw : undefined;
  if (input.isTTY) {
    input.setRawMode(true);
  }

  const startTime = now();
  let stopped = false;

  function handleKeypress(str, key) {
    const isCtrlC = key && key.ctrl && key.name === 'c';
    const isEscape = key && key.name === 'escape';
    if (isCtrlC || isEscape) {
      stop();
      onExit?.();
      return;
    }
    onKey(str, (now() - startTime) / 1000);
  }

  input.on('keypress', handleKeypress);

  function stop() {
    if (stopped) {
      return;
    }
    stopped = true;
    input.off('keypress', handleKeypress);
    if (input.isTTY && wasRaw !== undefined) {
      input.setRawMode(wasRaw);
    }
  }

  return stop;
}
