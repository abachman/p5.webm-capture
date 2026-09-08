import Capturer, { CapturerSettings } from "./capturer";

declare global {
  interface Window {
    p5?: any;
    enableCapture: (settings?: CapturerSettings) => void;
    captureFrame: () => Promise<void> | void;
    stopCapture: () => Promise<void> | void;
  }
}

if (typeof window !== "undefined") {
  // running in a browser, attach capturer to global window object
  const capturer = new Capturer();

  const enable = capturer.enableCapture.bind(capturer);
  const start = capturer.startCapture.bind(capturer);
  const capture = capturer.captureFrame.bind(capturer);
  const stop = capturer.stopCapture.bind(capturer);

  if (window.p5) {
    const p5 = window.p5;

    // p5.prototype.enableCapture = enable;
    // p5.prototype.stopCapture = stop;

    p5.prototype.registerMethod("init", function (this: any) {
      this.enableCapture = enable;
      this.stopCapture = stop;
      this.captureFrame = capture;
    });

    p5.prototype.registerMethod("pre", () => {
      start().catch((err) =>
        console.error("[webm-capture] Error in startCapture:", err)
      );
    });

    p5.prototype.registerMethod("post", () => {
      capture().catch((err) =>
        console.error("[webm-capture] Error in captureFrame:", err)
      );
    });
  } else {
    console.error(
      "[webm-capture] ERROR! Could not find p5 object. Make sure the p5.js <script> tag is included in the page before p5.webm-capture."
    );
  }
}
