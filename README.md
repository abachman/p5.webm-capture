# p5js webm capture

combination of cc-capture and webmwriter, handy for capturing frames of sketches and producing webm video output.

Works great with p5.js and Chrome. I wrote this so I could include it on https://editor.p5js.org sketches via CDN.

## included libraries

I have heartily abused the following libraries to make them play nicely with esbuild:

- [ccapture.js](https://github.com/spite/ccapture.js) is MIT Licensed by [Jaume Sanchez Elias](https://github.com/spite).
- [download](https://github.com/rndme/download) is MIT Licensed by [dandavis](https://github.com/rndme).
- [webm-writer](https://github.com/thenickdude/webm-writer-js) is licensed under the WTFPLv2 https://en.wikipedia.org/wiki/WTFPL by [thenickdude](https://github.com/thenickdude)

I stripped away everything not needed for running webm exports from Chrome.