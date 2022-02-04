import Capturer, { CapturerSettings } from "./Capturer";

declare global {
  interface Window {
    enableCapture: (settings: CapturerSettings) => void;
    captureFrame: () => void;
  }
}

if (window) {
  // running in a browser, attach capturer to global window object
  const capturer = new Capturer();
  window.enableCapture = capturer.enableCapture.bind(capturer);
  window.captureFrame = capturer.captureFrame.bind(capturer);
}
