/*
The MIT License

Copyright (c) 2012 Jaume Sanchez Elias
https://github.com/spite/ccapture.js

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

import { download } from "./download-4.21";
import { createWebMWriter } from "./webm-writer-0.3.0";

const WebMWriter = createWebMWriter();

// @license http://opensource.org/licenses/MIT
// copyright Paul Irish 2015

// Date.now() is supported everywhere except IE8. For IE8 we use the Date.now polyfill
//   github.com/Financial-Times/polyfill-service/blob/master/polyfills/Date.now/polyfill.js
// as Safari 6 doesn't have support for NavigationTiming, we use a Date.now() timestamp for relative values

// if you want values similar to what you'd get with real perf.now, place this towards the head of the page
// but in reality, you're just getting the delta between now() calls, so it's not terribly important where it's placed

(function () {
  if ("performance" in window == false) {
    window.performance = {};
  }

  if ("now" in window.performance == false) {
    let nowOffset = Date.now();

    window.performance.now = function now() {
      return Date.now() - nowOffset;
    };
  }
})();

function pad(n) {
  return String("0000000" + n).slice(-7);
}
// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Timers

let g_startTime = window.Date.now();

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

function CCFrameEncoder(settings) {
  let _handlers = {};

  this.settings = settings;

  this.on = function (event, handler) {
    _handlers[event] = handler;
  };

  this.emit = function (event) {
    let handler = _handlers[event];
    if (handler) {
      handler.apply(null, Array.prototype.slice.call(arguments, 1));
    }
  };

  this.filename = settings.name || guid();
  this.extension = "";
  this.mimeType = "";
}

CCFrameEncoder.prototype.start = function () {};
CCFrameEncoder.prototype.stop = function () {};
CCFrameEncoder.prototype.add = function () {};
CCFrameEncoder.prototype.save = function () {};
CCFrameEncoder.prototype.dispose = function () {};
CCFrameEncoder.prototype.safeToProceed = function () {
  return true;
};
CCFrameEncoder.prototype.step = function () {
  console.log("Step not set!");
};

/*
  WebM Encoder
*/

function CCWebMEncoder(settings) {
  // let canvas = document.createElement("canvas");
  CCFrameEncoder.call(this, settings);

  this.quality = settings.quality / 100 || 0.8;

  this.extension = ".webm";
  this.mimeType = "video/webm";
  this.baseFilename = this.filename;
  this.framerate = settings.framerate;

  this.frames = 0;
  this.part = 1;

  this.videoWriter = new WebMWriter({
    quality: this.quality,
    fileWriter: null,
    fd: null,
    frameRate: this.framerate,
  });
}

CCWebMEncoder.prototype = Object.create(CCFrameEncoder.prototype);

CCWebMEncoder.prototype.start = function (canvas) {
  this.dispose();
};

CCWebMEncoder.prototype.add = function (canvas) {
  this.videoWriter.addFrame(canvas);

  if (
    this.settings.autoSaveTime > 0 &&
    this.frames / this.settings.framerate >= this.settings.autoSaveTime
  ) {
    this.save(
      function (blob) {
        this.filename = this.baseFilename + "-part-" + pad(this.part);
        download(blob, this.filename + this.extension, this.mimeType);
        this.dispose();
        this.part++;
        this.filename = this.baseFilename + "-part-" + pad(this.part);
        this.step();
      }.bind(this)
    );
  } else {
    this.frames++;
    this.step();
  }
};

CCWebMEncoder.prototype.save = function (callback) {
  this.videoWriter.complete().then(callback);
};

CCWebMEncoder.prototype.dispose = function (canvas) {
  this.frames = 0;
  this.videoWriter = new WebMWriter({
    quality: this.quality,
    fileWriter: null,
    fd: null,
    frameRate: this.framerate,
  });
};

/*
  HTMLCanvasElement.captureStream()
*/

function CCStreamEncoder(settings) {
  CCFrameEncoder.call(this, settings);

  this.framerate = this.settings.framerate;
  this.type = "video/webm";
  this.extension = ".webm";
  this.stream = null;
  this.mediaRecorder = null;
  this.chunks = [];
}

CCStreamEncoder.prototype = Object.create(CCFrameEncoder.prototype);

CCStreamEncoder.prototype.add = function (canvas) {
  if (!this.stream) {
    this.stream = canvas.captureStream(this.framerate);
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.start();

    this.mediaRecorder.ondataavailable = function (e) {
      this.chunks.push(e.data);
    }.bind(this);
  }
  this.step();
};

CCStreamEncoder.prototype.save = function (callback) {
  this.mediaRecorder.onstop = function (e) {
    let blob = new Blob(this.chunks, { type: "video/webm" });
    this.chunks = [];
    callback(blob);
  }.bind(this);
  this.mediaRecorder.stop();
};

function CCGIFEncoder(settings) {
  CCFrameEncoder.call(this, settings);

  settings.quality = 31 - ((settings.quality * 30) / 100 || 10);
  settings.workers = settings.workers || 4;

  this.extension = ".gif";
  this.mimeType = "image/gif";

  this.canvas = document.createElement("canvas");
  this.ctx = this.canvas.getContext("2d");
  this.sizeSet = false;

  this.encoder = new GIF({
    workers: settings.workers,
    quality: settings.quality,
    workerScript: settings.workersPath + "gif.worker.js",
  });

  this.encoder.on(
    "progress",
    function (progress) {
      if (this.settings.onProgress) {
        this.settings.onProgress(progress);
      }
    }.bind(this)
  );

  this.encoder.on(
    "finished",
    function (blob) {
      let cb = this.callback;
      if (cb) {
        this.callback = undefined;
        cb(blob);
      }
    }.bind(this)
  );
}

CCGIFEncoder.prototype = Object.create(CCFrameEncoder.prototype);

CCGIFEncoder.prototype.add = function (canvas) {
  if (!this.sizeSet) {
    this.encoder.setOption("width", canvas.width);
    this.encoder.setOption("height", canvas.height);
    this.sizeSet = true;
  }

  this.canvas.width = canvas.width;
  this.canvas.height = canvas.height;
  this.ctx.drawImage(canvas, 0, 0);

  this.encoder.addFrame(this.ctx, { copy: true, delay: this.settings.step });
  this.step();

  /*this.encoder.setSize( canvas.width, canvas.height );
  let readBuffer = new Uint8Array(canvas.width * canvas.height * 4);
  let context = canvas.getContext( 'webgl' );
  context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, readBuffer);
  this.encoder.addFrame( readBuffer, true );*/
};

CCGIFEncoder.prototype.save = function (callback) {
  this.callback = callback;

  this.encoder.render();
};

function CCapture(settings) {
  let _settings = settings || {},
    _verbose,
    _time,
    _startTime,
    _performanceTime,
    _performanceStartTime,
    _step,
    _encoder,
    _timeouts = [],
    _intervals = [],
    _frameCount = 0,
    _intermediateFrameCount = 0,
    _requestAnimationFrameCallbacks = [],
    _capturing = false,
    _handlers = {};

  _settings.framerate = _settings.framerate || 60;
  _settings.motionBlurFrames = 2 * (_settings.motionBlurFrames || 1);
  _verbose = _settings.verbose || false;
  _settings.step = 1000.0 / _settings.framerate;
  _settings.timeLimit = _settings.timeLimit || 0;
  _settings.frameLimit = _settings.frameLimit || 0;
  _settings.startTime = _settings.startTime || 0;

  let _timeDisplay = document.createElement("div");
  _timeDisplay.style.position = "absolute";
  _timeDisplay.style.left = _timeDisplay.style.top = 0;
  _timeDisplay.style.backgroundColor = "black";
  _timeDisplay.style.fontFamily = "monospace";
  _timeDisplay.style.fontSize = "11px";
  _timeDisplay.style.padding = "5px";
  _timeDisplay.style.color = "red";
  _timeDisplay.style.zIndex = 100000;
  if (_settings.display) document.body.appendChild(_timeDisplay);

  const canvasMotionBlur = document.createElement("canvas");
  const ctxMotionBlur = canvasMotionBlur.getContext("2d");
  let bufferMotionBlur;
  let imageData;

  _log("Step is set to " + _settings.step + "ms");

  let _encoders = {
    webm: CCWebMEncoder,
    "webm-mediarecorder": CCStreamEncoder,
  };

  let ctor = _encoders[_settings.format];
  if (!ctor) {
    throw (
      "Error: Incorrect or missing format: Valid formats are " +
      Object.keys(_encoders).join(", ")
    );
  }

  _encoder = new ctor(_settings);
  _encoder.step = _step;

  _encoder.on("process", _process);
  _encoder.on("progress", _progress);

  if ("performance" in window == false) {
    window.performance = {};
  }

  Date.now =
    Date.now ||
    function () {
      // thanks IE8
      return new Date().getTime();
    };

  if ("now" in window.performance == false) {
    let nowOffset = Date.now();

    if (performance.timing && performance.timing.navigationStart) {
      nowOffset = performance.timing.navigationStart;
    }

    window.performance.now = function now() {
      return Date.now() - nowOffset;
    };
  }

  const _oldSetTimeout = window.setTimeout,
    _oldSetInterval = window.setInterval,
    _oldClearInterval = window.clearInterval,
    _oldClearTimeout = window.clearTimeout,
    _oldRequestAnimationFrame = window.requestAnimationFrame,
    _oldNow = window.Date.now,
    _oldPerformanceNow = window.performance.now,
    _oldGetTime = window.Date.prototype.getTime;

  let media = [];

  function _init() {
    _log("Capturer start");

    _startTime = window.Date.now();
    _time = _startTime + _settings.startTime;
    _performanceStartTime = window.performance.now();
    _performanceTime = _performanceStartTime + _settings.startTime;

    window.Date.prototype.getTime = function () {
      return _time;
    };
    window.Date.now = function () {
      return _time;
    };

    window.setTimeout = function (callback, time) {
      let t = {
        callback: callback,
        time: time,
        triggerTime: _time + time,
      };
      _timeouts.push(t);
      _log("Timeout set to " + t.time);
      return t;
    };
    window.clearTimeout = function (id) {
      for (let j = 0; j < _timeouts.length; j++) {
        if (_timeouts[j] == id) {
          _timeouts.splice(j, 1);
          _log("Timeout cleared");
          continue;
        }
      }
    };
    window.setInterval = function (callback, time) {
      let t = {
        callback: callback,
        time: time,
        triggerTime: _time + time,
      };
      _intervals.push(t);
      _log("Interval set to " + t.time);
      return t;
    };
    window.clearInterval = function (id) {
      _log("clear Interval");
      return null;
    };
    window.requestAnimationFrame = function (callback) {
      _requestAnimationFrameCallbacks.push(callback);
    };
    window.performance.now = function () {
      return _performanceTime;
    };

    function hookCurrentTime() {
      if (!this._hooked) {
        this._hooked = true;
        this._hookedTime = this.currentTime || 0;
        this.pause();
        media.push(this);
      }
      return this._hookedTime + _settings.startTime;
    }

    try {
      Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
        get: hookCurrentTime,
      });
      Object.defineProperty(HTMLAudioElement.prototype, "currentTime", {
        get: hookCurrentTime,
      });
    } catch (err) {
      _log(err);
    }
  }

  function _start() {
    _init();
    _encoder.start();
    _capturing = true;
  }

  function _stop() {
    _capturing = false;
    _encoder.stop();
    _destroy();
  }

  function _call(fn, p) {
    _oldSetTimeout(fn, 0, p);
  }

  function _step() {
    _call(_process);
  }

  function _destroy() {
    _log("Capturer stop");
    window.setTimeout = _oldSetTimeout;
    window.setInterval = _oldSetInterval;
    window.clearInterval = _oldClearInterval;
    window.clearTimeout = _oldClearTimeout;
    window.requestAnimationFrame = _oldRequestAnimationFrame;
    window.Date.prototype.getTime = _oldGetTime;
    window.Date.now = _oldNow;
    window.performance.now = _oldPerformanceNow;
  }

  function _updateTime() {
    let seconds = _frameCount / _settings.framerate;
    if (
      (_settings.frameLimit && _frameCount >= _settings.frameLimit) ||
      (_settings.timeLimit && seconds >= _settings.timeLimit)
    ) {
      _stop();
      _save();
    }
    let d = new Date(null);
    d.setSeconds(seconds);
    if (_settings.motionBlurFrames > 2) {
      _timeDisplay.textContent =
        "CCapture " +
        _settings.format +
        " | " +
        _frameCount +
        " frames (" +
        _intermediateFrameCount +
        " inter) | " +
        d.toISOString().substr(11, 8);
    } else {
      _timeDisplay.textContent =
        "CCapture " +
        _settings.format +
        " | " +
        _frameCount +
        " frames | " +
        d.toISOString().substr(11, 8);
    }
  }

  function _checkFrame(canvas) {
    if (
      canvasMotionBlur.width !== canvas.width ||
      canvasMotionBlur.height !== canvas.height
    ) {
      canvasMotionBlur.width = canvas.width;
      canvasMotionBlur.height = canvas.height;
      bufferMotionBlur = new Uint16Array(
        canvasMotionBlur.height * canvasMotionBlur.width * 4
      );
      ctxMotionBlur.fillStyle = "#0";
      ctxMotionBlur.fillRect(
        0,
        0,
        canvasMotionBlur.width,
        canvasMotionBlur.height
      );
    }
  }

  function _blendFrame(canvas) {
    ctxMotionBlur.drawImage(canvas, 0, 0);
    imageData = ctxMotionBlur.getImageData(
      0,
      0,
      canvasMotionBlur.width,
      canvasMotionBlur.height
    );
    for (let j = 0; j < bufferMotionBlur.length; j += 4) {
      bufferMotionBlur[j] += imageData.data[j];
      bufferMotionBlur[j + 1] += imageData.data[j + 1];
      bufferMotionBlur[j + 2] += imageData.data[j + 2];
    }
    _intermediateFrameCount++;
  }

  function _saveFrame() {
    let data = imageData.data;
    for (let j = 0; j < bufferMotionBlur.length; j += 4) {
      data[j] = (bufferMotionBlur[j] * 2) / _settings.motionBlurFrames;
      data[j + 1] = (bufferMotionBlur[j + 1] * 2) / _settings.motionBlurFrames;
      data[j + 2] = (bufferMotionBlur[j + 2] * 2) / _settings.motionBlurFrames;
    }
    ctxMotionBlur.putImageData(imageData, 0, 0);
    _encoder.add(canvasMotionBlur);
    _frameCount++;
    _intermediateFrameCount = 0;
    _log("Full MB Frame! " + _frameCount + " " + _time);
    for (let j = 0; j < bufferMotionBlur.length; j += 4) {
      bufferMotionBlur[j] = 0;
      bufferMotionBlur[j + 1] = 0;
      bufferMotionBlur[j + 2] = 0;
    }
    gc();
  }

  function _capture(canvas) {
    if (_capturing) {
      if (_settings.motionBlurFrames > 2) {
        _checkFrame(canvas);
        _blendFrame(canvas);

        if (_intermediateFrameCount >= 0.5 * _settings.motionBlurFrames) {
          _saveFrame();
        } else {
          _step();
        }
      } else {
        _encoder.add(canvas);
        _frameCount++;
        _log("Full Frame! " + _frameCount);
      }
    }
  }

  function _process() {
    let step = 1000 / _settings.framerate;
    let dt =
      (_frameCount + _intermediateFrameCount / _settings.motionBlurFrames) *
      step;

    _time = _startTime + dt;
    _performanceTime = _performanceStartTime + dt;

    media.forEach(function (v) {
      v._hookedTime = dt / 1000;
    });

    _updateTime();
    _log("Frame: " + _frameCount + " " + _intermediateFrameCount);

    for (let j = 0; j < _timeouts.length; j++) {
      if (_time >= _timeouts[j].triggerTime) {
        _call(_timeouts[j].callback);
        //console.log( 'timeout!' );
        _timeouts.splice(j, 1);
        continue;
      }
    }

    for (let j = 0; j < _intervals.length; j++) {
      if (_time >= _intervals[j].triggerTime) {
        _call(_intervals[j].callback);
        _intervals[j].triggerTime += _intervals[j].time;
        //console.log( 'interval!' );
        continue;
      }
    }

    _requestAnimationFrameCallbacks.forEach(function (cb) {
      _call(cb, _time - g_startTime);
    });
    _requestAnimationFrameCallbacks = [];
  }

  function _save(callback) {
    if (!callback) {
      callback = function (blob) {
        download(
          blob,
          _encoder.filename + _encoder.extension,
          _encoder.mimeType
        );
        return false;
      };
    }
    _encoder.save(callback);
  }

  function _log(message) {
    if (_verbose) console.log(message);
  }

  function _on(event, handler) {
    _handlers[event] = handler;
  }

  function _emit(event) {
    let handler = _handlers[event];
    if (handler) {
      handler.apply(null, Array.prototype.slice.call(arguments, 1));
    }
  }

  function _progress(progress) {
    _emit("progress", progress);
  }

  return {
    start: _start,
    capture: _capture,
    stop: _stop,
    save: _save,
    on: _on,
  };
}

export { CCapture };
