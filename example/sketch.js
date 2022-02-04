const bubbles = [];

function gen(y) {
  const RANGE = 200;
  return [random(-RANGE, RANGE), y, random(-RANGE, RANGE)];
}

function setup() {
  createCanvas(400, 400, WEBGL);

  // \/-------------- p5.webm-capture
  enableCapture({
    frameCount: 60, // just one second of video
    frameRate: 60, // at 60 fps
    display: true, // with the little counter in the top left
    element: document.querySelector("canvas"), // pick the obvious canvas
    onComplete: function () {
      noLoop();
    }, // stop the sketch on download
  });
  // ^^^^^^^^^^^^

  for (let y = -400; y <= 400; y += 10) {
    bubbles.push(gen(-y));
  }
}

function draw() {
  background(0);

  const cy = -frameCount * 1;

  ambientLight(100);

  rotateY(frameCount * 0.02);

  pointLight(40, 200, 100, -50, cy + 20, 50);
  pointLight(250, 100, 0, 29, cy, height / 2 / tan(PI / 6));
  pointLight(0, 100, 250, -10, cy - 20, 100);

  fill(200);
  noStroke();

  bubbles.forEach(([x, y, z]) => {
    push();
    translate(x, y, z);
    sphere(30);
    pop();
  });

  camera(0, cy, height / 2 / tan(PI / 6), 0, cy, 0, 0, 1, 0);

  // add one to the beginning
  if (cy - 300 < bubbles[bubbles.length - 1][1] - 10) {
    for (let n = 0; n < 1; n++) {
      bubbles.push(gen(cy - 300));
    }
  }

  // take one off the end
  if (bubbles[0][1] > cy + height / 2 + 100) bubbles.shift();

  captureFrame(); // <------ here look at this
}
