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

  if (window.p5) {
    // if p5 is already included, also bind to the global p5 object
    window.p5.enableCapture = capturer.enableCapture.bind(capturer);
    window.p5.captureFrame = capturer.captureFrame.bind(capturer);
  }

  window.enableCapture = capturer.enableCapture.bind(capturer);
  window.captureFrame = capturer.captureFrame.bind(capturer);
}
