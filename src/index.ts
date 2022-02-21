import Capturer, { CapturerSettings } from "./Capturer";

declare global {
  interface Window {
    p5?: any;
    enableCapture: (settings: CapturerSettings) => void;
    captureFrame: () => void;
  }
}

if (window) {
  // running in a browser, attach capturer to global window object
  const capturer = new Capturer();

  const enable = capturer.enableCapture.bind(capturer);
  const start = capturer.startCapture.bind(capturer);
  const capture = capturer.captureFrame.bind(capturer);

  if (window.p5) {
    const p5 = window.p5;

    p5.prototype.enableCapture = enable;

    p5.prototype.registerMethod("init", () => {
      (this as any).enableCapture = enable;
    });

    p5.prototype.registerMethod("pre", () => {
      start();
    });

    p5.prototype.registerMethod("post", () => {
      try {
        capture();
      } catch (ex) {
        console.error(ex);
      }
    });
  } else {
    console.error([
      "[webm-capture] ERROR! Could not find p5 object. Make sure the p5.js <script> tag is included in the page before p5.webm-capture.",
    ]);
  }
}
