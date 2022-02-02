import CCapture from "ccapture.js";

export type CapturerSettings = {
  frameCount: number;
  element: HTMLCanvasElement;
  onComplete?: Function;
};

export default class Capturer {
  running: boolean;
  active: boolean;
  capture: CCapture;
  maxFrames: number;
  frames: number;
  el: HTMLCanvasElement;
  onComplete: Function;

  constructor() {
    this.active = false;
    this.running = false;
  }

  enableCapture({ frameCount, element, onComplete }: CapturerSettings) {
    this.active = true;
    this.el = element;
    this.maxFrames = frameCount;
    this.frames = 0;
    this.capture = new CCapture({
      framerate: 60,
      format: "webm",
      verbose: false,
    });
    this.onComplete = onComplete || function () {};
  }

  captureFrame() {
    if (this.active && !this.running) {
      this.capture.start();
    }

    if (this.active) {
      this.capture.capture(this.el);
      this.frames++;

      if (this.frames > this.maxFrames) {
        this.capture.stop();
        this.capture.save();
        this.onComplete();
      }
    }
  }
}