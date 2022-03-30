function setup() {
  createCanvas(400, 400);
  noStroke();
  enableCapture({
    frameCount: -1, // just one second of video
    frameRate: 60, // at 60 fps
    display: true, // with the little counter in the top left
    element: document.querySelector("canvas"), // pick the obvious canvas
    onComplete: function () {
      noLoop();
    },
  });
}

function draw() {
  background(0);

  const r = 100;
  const x = r * cos(radians((360 / 60) * frameCount));
  const y = r * sin(radians((360 / 60) * frameCount));

  translate(width / 2, height / 2);
  fill(100);
  ellipse(100, 0, 10);

  fill(255, 0, 0);
  ellipse(x, y, 10);

  if (frameCount == 61) {
    stopCapture();
  }
}
