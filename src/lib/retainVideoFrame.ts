/**
 * Keep presentation separate from the decoder's disposable canvas. A decoder
 * reset, empty drawing buffer, or missing frame must not erase the last image.
 */
export function retainVideoFrame(
  stage: HTMLElement,
  display: HTMLCanvasElement,
  onFirstFrame: () => void,
) {
  const output = display.getContext("2d");
  const sample = document.createElement("canvas");
  const context = sample.getContext("2d", { willReadFrequently: true });
  sample.width = 16;
  sample.height = 9;
  let request = 0;
  let enabled = false;
  let hasFrame = false;
  let disposed = false;

  function draw() {
    if (disposed) return;
    request = requestAnimationFrame(draw);
    if (!enabled || !output || !context) return;
    const source = stage.querySelector("canvas, video");
    if (!(source instanceof HTMLCanvasElement || source instanceof HTMLVideoElement)) return;
    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    if (!width || !height) return;
    if (source instanceof HTMLVideoElement && source.readyState < 2) return;

    try {
      // WebGL drawing buffers can be transparent between presentations. Do not
      // replace the retained frame with an empty buffer. Actual black video is valid.
      context.clearRect(0, 0, 16, 9);
      context.drawImage(source, 0, 0, 16, 9);
      const pixels = context.getImageData(0, 0, 16, 9).data;
      if (!pixels.some((value, index) => index % 4 === 3 && value > 0)) return;
      if (display.width !== width || display.height !== height) {
        display.width = width;
        display.height = height;
      }
      output.drawImage(source, 0, 0, width, height);
      if (!hasFrame) {
        hasFrame = true;
        display.style.visibility = "visible";
        onFirstFrame();
      }
    } catch {
      // A renderer being torn down is not a new frame.
    }
  }
  request = requestAnimationFrame(draw);

  return {
    setPlaying(value: boolean) { enabled = value; },
    dispose() {
      disposed = true;
      cancelAnimationFrame(request);
      display.style.visibility = "hidden";
      output?.clearRect(0, 0, display.width, display.height);
    },
  };
}
