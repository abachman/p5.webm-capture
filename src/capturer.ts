import { CCapture } from "./vendor/ccapture-1.0.9";

declare global {
  interface Window {
    CCapture: any;
  }
}

export type CapturerSettings = {
  element?: HTMLCanvasElement; // <canvas> element to capture
  frameCount?: number; // total number of frames to capture
  display?: boolean; // show CCapture HUD
  frameRate?: number; // defaults to 60
  onComplete?: Function; // callback on recording completion
};

export default class Capturer {
  running: boolean;
  active: boolean;
  capture: ReturnType<typeof CCapture>;
  maxFrames: number;
  frames: number;
  el: HTMLCanvasElement;
  onComplete: Function;

  constructor() {
    this.active = false;
    this.running = false;
  }

  enableCapture(settings: CapturerSettings = {}) {
    this.active = true;
    this.el = settings.element || document.querySelector("canvas");
    this.maxFrames = settings.frameCount || 600;
    this.capture = CCapture({
      framerate: settings.frameRate || 60,
      format: "webm", // required
      verbose: false,
      display: !!settings.display,
    });
    this.onComplete = settings.onComplete || function () {};
  }

  // must be safe to call on every frame
  startCapture() {
    if (this.active && !this.running) {
      console.log("[webm-capture] started");
      this.capture.start();
      this.frames = 0;
      this.running = true;
    }
  }

  captureFrame() {
    if (this.active) {
      this.capture.capture(this.el);
      this.frames++;

      if (this.frames >= this.maxFrames) {
        console.log("[webm-capture] finished");
        this.capture.stop();
        this.capture.save();
        this.onComplete();
        this.active = false;
      }
    }
  }
}
