import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

test('retains frames across empty buffers and reconnects, accepts black video, and clears on stop', () => {
  let next;
  let drawn = 0;
  let cleared = 0;
  let firstFrames = 0;
  let alpha = 255;
  class Canvas { width = 640; height = 360; }
  class Video {}
  let source = new Canvas();
  const display = {
    width: 640, height: 360, style: {},
    getContext: () => ({ drawImage: () => drawn++, clearRect: () => cleared++ }),
  };
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(readFileSync('src/lib/retainVideoFrame.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  runInNewContext(code, {
    exports: compiledModule.exports,
    HTMLCanvasElement: Canvas, HTMLVideoElement: Video,
    document: { createElement: () => ({ getContext: () => ({
      clearRect() {}, drawImage() {},
      getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, alpha]) }),
    }) }) },
    requestAnimationFrame: (callback) => { next = callback; return 1; },
    cancelAnimationFrame: () => { next = undefined; },
  });
  const retained = compiledModule.exports.retainVideoFrame({ querySelector: () => source }, display, () => firstFrames++);
  next();
  assert.equal(drawn, 0, 'startup must not show an unrendered buffer');
  retained.setPlaying(true);
  next();
  assert.equal(drawn, 1, 'opaque black is legitimate video');
  assert.equal(display.style.visibility, 'visible');
  alpha = 0;
  next();
  assert.equal(drawn, 1, 'empty WebGL buffer must not overwrite last frame');
  source = null;
  next();
  retained.setPlaying(false);
  source = new Canvas();
  alpha = 255;
  next();
  assert.equal(drawn, 1, 'replacement renderer must wait for first frame');
  assert.equal(cleared, 0, 'reconnection must not clear the display');
  retained.setPlaying(true);
  next();
  assert.equal(drawn, 2);
  assert.equal(firstFrames, 1);
  retained.dispose();
  assert.equal(display.style.visibility, 'hidden');
  assert.equal(cleared, 1);
  assert.equal(next, undefined);
});
