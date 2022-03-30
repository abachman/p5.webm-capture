# p5js webm capture

[![npm version](https://badge.fury.io/js/p5.webm-capture.svg)](https://badge.fury.io/js/p5.webm-capture)

record frame-perfect p5.js sketches to .webm format video files in the Chrome browser. handy for turning slow-developing simulation sketches into smooth animations or creating perfect-loop videos.

combination of cc-capture and webm-writer, handy for capturing frames of sketches and producing webm video output. different from other p5.recording libraries because it doesn't capture a video stream of the canvas, it captures frames individually and rebuilds them into a webm video file, so you can produce a smooth final product even if your sketch is running on a slow computer.

designed to work with p5.js and Chrome. I wrote this so I could include it on https://editor.p5js.org sketches via CDN.

it is currently available at: https://unpkg.com/p5.webm-capture@1.2.0/dist/p5.webm-capture.js

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
    <script src="https://unpkg.com/p5.webm-capture@1.2.0/dist/p5.webm-capture.js"></script>
    <meta charset="utf-8" />
  </head>
  <body>
    <script>
      let c = 0;

      function setup() {
        createCanvas(400, 400);
        colorMode(HSB);
        enableCapture({
          frameCount: 360,
        });
      }

      function draw() {
        background(c, 100, 100);
        c = (c + 1) % 360;
      }
    </script>
  </body>
</html>
```

## Usage

Include p5.webm-capture.js in your index.html page right anytime after your p5.js script tag. **p5.js must be loaded before p5.webm-writer**.

p5.webm-writer only has one function you need to worry about: `enableCapture`. It should be called from your `setup()` function after `createCanvas`.

### enableCapture

Should be called in sketch `setup()`, after `createCanvas`.

```js

```

Prepares the webm-capture library to start grabbing frames. Call this in your `setup` function.

Options (defaults shown in square brackets):

- `element` {HTMLCanvasElement} [querySelector('canvas')] the `<canvas>` tag p5.js is drawing to. If you're using https://editor.p5js.org, it's usually `document.getElementById("defaultCanvas0")`.
- `frameCount` {Integer} [600] the total number of frames to capture. If you give a value less than 1, the library will run in "manual stop" mode and you'll have to call `stopCapture` to finish.
- `frameRate` {Integer} [60] sets the frames-per-second of the final video. _NOTE:_ this doesn't have to be the same as the frameRate of the p5.js sketch.
- `display` {boolean} [false] shows a HUD style timecode view
- `onComplete` {Function} [function () {}] a function that is called when capture is complete. You could use this to stop the sketch or send a message to an external process.

So a call with every option given would look like:

```js
enableCapture({
  element: document.querySelector("canvas"),
  frameCount: 120,
  frameRate: 30,
  display: true,
  onComplete: function () {
    alert("boop!");
  },
});
```

By default a 10 second video at 60fps will be captured.

### stopCapture

This is an **optional** method that can be called anytime during recording to stop capturing frames, download the recorded video, and call `onComplete`.

If you give a value less than 1 for `frameCount`, calling `stopCapture()` is required to stop recording and download. This is "manual stop" mode.

## included libraries

I have heartily abused the following libraries to make them play nicely with esbuild:

- [ccapture.js](https://github.com/spite/ccapture.js) is MIT Licensed by [Jaume Sanchez Elias](https://github.com/spite).
- [download](https://github.com/rndme/download) is MIT Licensed by [dandavis](https://github.com/rndme).
- [webm-writer](https://github.com/thenickdude/webm-writer-js) is licensed under the WTFPLv2 https://en.wikipedia.org/wiki/WTFPL by [thenickdude](https://github.com/thenickdude)

I stripped away everything not needed for running webm exports from Chrome. You can find their source in the `src/vendor` folder.

## hacking

Make changes, then:

```sh

$ npm run build
$ cd example
$ ./serve
$ open http://localhost:8000
```

## Changelog

**1.2.0**: expose the `stopCapture` method and allow passing a value less than 1 to `frameCount` to signal the intent to stop recording manually.

**1.1.0**: [uses p5.js library hooks](https://github.com/processing/p5.js/blob/fd5240a9/contributor_docs/creating_libraries.md#use-registermethod-to-register-functions-with-p5-that-should-be-called-at-various-times) so that `captureFrame()` is called after the draw() function automatically.

**1.0.1**: functioning release (like 30 minutes after 1.0.0)

**1.0.0**: initial release.
