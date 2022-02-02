import Capturer, { CapturerSettings } from "./capturer";

declare global {
  interface Window {
    enableCapture: (settings: CapturerSettings) => void;
    captureFrame: () => void;
  }
}

if (window) {
  // running in a browser, attach capturer to global window object
  const capturer = new Capturer();
  window.enableCapture = capturer.enableCapture;
  window.captureFrame = capturer.captureFrame;
}
