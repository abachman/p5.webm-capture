# p5js webm capture

[![npm version](https://badge.fury.io/js/p5.webm-capture.svg)](https://badge.fury.io/js/p5.webm-capture)

combination of cc-capture and webm-writer, handy for capturing frames of sketches and producing webm video output. different from other p5.recording libraries because it doesn't capture a video stream of the canvas, it captures frames individually and rebuilds them into a webm video file, so you can produce a smooth final product even if your sketch is running on a slow computer.

designed to work with p5.js and Chrome. I wrote this so I could include it on https://editor.p5js.org sketches via CDN.

It is currently available at: https://unpkg.com/p5.webm-capture@1.0.1/dist/p5.webm-capture.js

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://unpkg.com/p5.webm-capture@1.0.1/dist/p5.webm-capture.js"></script>
    <meta charset="utf-8" />
  </head>
  <body>
    <script>
      let c = 0;

      function setup() {
        createCanvas(400, 400);
        colorMode(HSB);
        enableCapture({
          frameCount: 360
        });
      }

      function draw() {
        background(c, 100, 100);
        c = (c + 1) % 360
        captureFrame();
      }
    </script>
  </body>
</html>
```

## Usage

p5.webm-writer provides two functions: `enableCapture` and `captureFrame`.

### enableCapture

```js
enableCapture(options = {})
```

Prepares the webm-capture library to start grabbing frames. Call this in your `setup` function.

Options (defaults shown in square brackets):
- `element` {HTMLCanvasElement} [querySelector('canvas')] the `<canvas>` tag p5.js is drawing to. If you're using https://editor.p5js.org, it's usually `document.getElementById("defaultCanvas0")`.
- `frameCount` {Integer} [600] the total number of frames to capture
- `frameRate` {Integer} [60] sets the frames-per-second of the final video. *NOTE:* this doesn't have to be the frameRate of the normally running p5.js sketch.
- `display` {boolean} [false] shows a HUD style timecode view
- `onComplete` {Function} [() => void] a function that's called when capture is complete

### captureFrame

```
captureFrame()
```

Must be called once per frame to capture the current sketch animation frame. Call this at the end of your `draw` function.

After the first time this function is called, ccapture.js takes over all animation timing functions, so the sketch rendering will get jerky, but the recording should be smooth.

Once the requested number of frames have been recorded, the .webm video will automatically download.

## Example

```js
let c = 0;

function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
  enableCapture({
    frameCount: 360,
    onComplete: function () { noLoop() }
  });
}

function draw() {
  background(c, 100, 100);
  c = (c + 1) % 360
  captureFrame();
}
```

## included libraries


I have heartily abused the following libraries to make them play nicely with esbuild:

- [ccapture.js](https://github.com/spite/ccapture.js) is MIT Licensed by [Jaume Sanchez Elias](https://github.com/spite).
- [download](https://github.com/rndme/download) is MIT Licensed by [dandavis](https://github.com/rndme).
- [webm-writer](https://github.com/thenickdude/webm-writer-js) is licensed under the WTFPLv2 https://en.wikipedia.org/wiki/WTFPL by [thenickdude](https://github.com/thenickdude)

I stripped away everything not needed for running webm exports from Chrome.
