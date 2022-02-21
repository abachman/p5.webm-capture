const FRAMES = 60;

function setup() {
  createCanvas(400, 400, WEBGL);

  enableCapture({
    frameCount: FRAMES, // just one second of video
    frameRate: 30, // at 60 fps
    display: true, // with the little counter in the top left
    element: document.querySelector("canvas"), // pick the obvious canvas
    onComplete: function () {
      noLoop();
    },
  });
}

function draw() {
  background(0);

  lights();
  pointLight(100, 100, 50);

  rotateY(radians((360 / FRAMES) * frameCount));
  // const r = 100;
  // const x = r * cos(radians((360 / FRAMES) * frameCount));
  // const y = r * sin(radians((360 / FRAMES) * frameCount));

  // translate(width / 2, height / 2);
  torus(80, 10, 100);
}
