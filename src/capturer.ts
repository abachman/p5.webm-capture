// import CCapture from "ccapture.js";
import { FrameWrap } from "ccapture.js";

export type CapturerSettings = {
  element?: HTMLCanvasElement; // <canvas> element to capture
  frameCount?: number; // total number of frames to capture, set to < 1 for manual stopCapture()
  display?: boolean; // show CCapture HUD
  frameRate?: number; // defaults to 60
  quality?: number; // 0-100, default 90
  format?: string; // defaults to "webm"
  verbose?: boolean; // log internal steps, default false
  onComplete?: (blob?: Blob) => void; // callback on recording completion
};

export default class Capturer {
  running: boolean;
  active: boolean;
  capture: FrameWrap | null;
  maxFrames: number;
  frames: number;
  el: HTMLCanvasElement | null;
  onComplete: (blob?: Blob) => void;
  manualStop: boolean;
  startup: undefined | Promise<unknown>
  verbose: boolean;

  constructor() {
    this.active = false;
    this.running = false;
    this.manualStop = false;
    this.capture = null;
    this.maxFrames = 600;
    this.frames = 0;
    this.el = null;
    this.onComplete = () => {};
    this.verbose = false;
  }

  enableCapture(settings: CapturerSettings = {}) {
    this.active = true;
    this.el = settings.element || document.querySelector("canvas");
    const frameCount = settings.frameCount !== undefined ? settings.frameCount : 600;
    this.manualStop = frameCount < 1;
    this.maxFrames = this.manualStop ? Infinity : frameCount;
    this.verbose = !!settings.verbose;
    this.capture = new FrameWrap({
      framerate: settings.frameRate || 60,
      format: settings.format || "webm",
      quality: settings.quality !== undefined ? settings.quality : 90,
      verbose: !!settings.verbose,
      display: !!settings.display,
      motionBlurFrames: 1, // don't do motion blur
      startTime: 0 // always start from the beginning
    });
    this.onComplete = settings.onComplete || (() => {});
  }

  // must be safe to call on every frame
  startCapture() {
    if (this.active && !this.running && this.capture) {
      if (this.verbose) {
        console.log("[webm-capture] started");
      }
      this.frames = 0;
      this.running = true;
      this.startup = this.capture.start();
    }
  }

  async captureFrame() {
    if (!this.active || !this.capture) {
      console.warn('[webm-capture] captureFrame skipped, capturer no longer active or not initialized');
      return;
    }

    const canvas = this.el || document.querySelector("canvas");
    if (!canvas) {
      console.warn('[webm-capture] captureFrame skipped, canvas could not be found');
      return;
    }

    // let the CCapture FrameWrap library finish startup before trying to
    // capture the first frame
    if (this.startup) await this.startup;

    await this.capture.capture(canvas);
    this.frames++;
    if (this.verbose) {
      console.log("[webm-capture] captured frame", this.frames, "from", canvas);
    }

    if (!this.manualStop && this.frames >= this.maxFrames) {
      await this.stopCapture();
    }
  }

  async stopCapture() {
    if (!this.active || !this.capture) return;
    this.active = false;
    this.running = false;
    await this.capture.stop();
    if (this.verbose) {
      console.log("[webm-capture] finished");
    }
    const blob = await this.capture.save();
    if (this.verbose) {
      console.log("[webm-capture] saved", blob?.size, "bytes");
    }
    this.onComplete(blob || undefined);
  }
}
