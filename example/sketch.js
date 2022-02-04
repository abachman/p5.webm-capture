/*

p5.webm-writer provides two functions:

  enableCapture({
                  frameCount: number;
                  element: HTMLCanvasElement;
                  onComplete?: Function;
                }):
    prepares the webm-capture library to start grabbing frames.

    - `frameCount` is the number of frames you want to capture (at 60fps)
    - `element` should be the <canvas> tag p5.js is drawing to
    - `onComplete` is a function that's called when capture is complete

  captureFrame():
    must be called once per frame to capture the current sketch animation frame.

    after the first time this function is called, ccapture.js takes over all
    animation timing functions, so the sketch rendering will get jerky, but the
    recording should be a smooth 60fps.

    once the requested number of frames have been recorded, the .webm video will
    automatically download.
*/
const sphs = [];

function gen(y) {
  const RANGE = 200;
  return [random(-RANGE, RANGE), y, random(-RANGE, RANGE)];
}

function setup() {
  createCanvas(400, 400, WEBGL);
  enableCapture({
    frameCount: 60,
    element: document.querySelector("canvas"),
    onComplete: function () {
      noLoop();
    },
  });
  for (let y = -400; y <= 400; y += 10) {
    sphs.push(gen(-y));
  }
}

function draw() {
  background(0);

  let locX = mouseX - width / 2;
  let locY = mouseY - height / 2;

  const cy = -frameCount * 1;

  ambientLight(100);

  rotateY(frameCount * 0.02);

  pointLight(40, 200, 100, -50, cy + 20, 50);
  pointLight(250, 100, 0, 29, cy, height / 2 / tan(PI / 6));
  pointLight(0, 100, 250, -10, cy - 20, 100);

  fill(200);
  noStroke();

  sphs.forEach(([x, y, z]) => {
    push();
    translate(x, y, z);
    sphere(30);
    pop();
  });

  camera(0, cy, height / 2 / tan(PI / 6), 0, cy, 0, 0, 1, 0);

  if (cy - 300 < sphs[sphs.length - 1][1] - 10) {
    for (let n = 0; n < 1; n++) {
      sphs.push(gen(cy - 300));
    }
  }

  if (sphs[0][1] > cy + height / 2 + 100) sphs.shift();

  captureFrame();
}
