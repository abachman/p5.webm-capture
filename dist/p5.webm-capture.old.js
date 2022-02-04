(() => {
  (function () {
    var z = !1,
      g = function (r) {
        (this.data = new Uint8Array(r)), (this.pos = 0);
      };
    (g.prototype.seek = function (r) {
      this.pos = r;
    }),
      (g.prototype.writeBytes = function (r) {
        for (var s = 0; s < r.length; s++) this.data[this.pos++] = r[s];
      }),
      (g.prototype.writeByte = function (r) {
        this.data[this.pos++] = r;
      }),
      (g.prototype.writeU8 = g.prototype.writeByte),
      (g.prototype.writeU16BE = function (r) {
        (this.data[this.pos++] = r >> 8), (this.data[this.pos++] = r);
      }),
      (g.prototype.writeDoubleBE = function (r) {
        for (
          var s = new Uint8Array(new Float64Array([r]).buffer),
            d = s.length - 1;
          d >= 0;
          d--
        )
          this.writeByte(s[d]);
      }),
      (g.prototype.writeFloatBE = function (r) {
        for (
          var s = new Uint8Array(new Float32Array([r]).buffer),
            d = s.length - 1;
          d >= 0;
          d--
        )
          this.writeByte(s[d]);
      }),
      (g.prototype.writeString = function (r) {
        for (var s = 0; s < r.length; s++)
          this.data[this.pos++] = r.charCodeAt(s);
      }),
      (g.prototype.writeEBMLVarIntWidth = function (r, s) {
        switch (s) {
          case 1:
            this.writeU8((1 << 7) | r);
            break;
          case 2:
            this.writeU8((1 << 6) | (r >> 8)), this.writeU8(r);
            break;
          case 3:
            this.writeU8((1 << 5) | (r >> 16)),
              this.writeU8(r >> 8),
              this.writeU8(r);
            break;
          case 4:
            this.writeU8((1 << 4) | (r >> 24)),
              this.writeU8(r >> 16),
              this.writeU8(r >> 8),
              this.writeU8(r);
            break;
          case 5:
            this.writeU8((1 << 3) | ((r / 4294967296) & 7)),
              this.writeU8(r >> 24),
              this.writeU8(r >> 16),
              this.writeU8(r >> 8),
              this.writeU8(r);
            break;
          default:
            throw new RuntimeException("Bad EBML VINT size " + s);
        }
      }),
      (g.prototype.measureEBMLVarInt = function (r) {
        if (r < (1 << 7) - 1) return 1;
        if (r < (1 << 14) - 1) return 2;
        if (r < (1 << 21) - 1) return 3;
        if (r < (1 << 28) - 1) return 4;
        if (r < 34359738367) return 5;
        throw new RuntimeException("EBML VINT size not supported " + r);
      }),
      (g.prototype.writeEBMLVarInt = function (r) {
        this.writeEBMLVarIntWidth(r, this.measureEBMLVarInt(r));
      }),
      (g.prototype.writeUnsignedIntBE = function (r, s) {
        switch ((s === void 0 && (s = this.measureUnsignedInt(r)), s)) {
          case 5:
            this.writeU8(Math.floor(r / 4294967296));
          case 4:
            this.writeU8(r >> 24);
          case 3:
            this.writeU8(r >> 16);
          case 2:
            this.writeU8(r >> 8);
          case 1:
            this.writeU8(r);
            break;
          default:
            throw new RuntimeException("Bad UINT size " + s);
        }
      }),
      (g.prototype.measureUnsignedInt = function (r) {
        return r < 1 << 8
          ? 1
          : r < 1 << 16
          ? 2
          : r < 1 << 24
          ? 3
          : r < 4294967296
          ? 4
          : 5;
      }),
      (g.prototype.getAsDataArray = function () {
        if (this.pos < this.data.byteLength)
          return this.data.subarray(0, this.pos);
        if (this.pos == this.data.byteLength) return this.data;
        throw "ArrayBufferDataStream's pos lies beyond end of buffer";
      }),
      (window.ArrayBufferDataStream = g);
    var V = (function (r) {
      return function (s) {
        var d = [],
          h = Promise.resolve(),
          w = null,
          T = null;
        typeof FileWriter != "undefined" && s instanceof FileWriter
          ? (w = s)
          : r && s && (T = s),
          (this.pos = 0),
          (this.length = 0);
        function C(e) {
          return new Promise(function (t, a) {
            var i = new FileReader();
            i.addEventListener("loadend", function () {
              t(i.result);
            }),
              i.readAsArrayBuffer(e);
          });
        }
        function L(e) {
          return new Promise(function (t, a) {
            e instanceof Uint8Array
              ? t(e)
              : e instanceof ArrayBuffer || ArrayBuffer.isView(e)
              ? t(new Uint8Array(e))
              : e instanceof Blob
              ? t(
                  C(e).then(function (i) {
                    return new Uint8Array(i);
                  })
                )
              : t(
                  C(new Blob([e])).then(function (i) {
                    return new Uint8Array(i);
                  })
                );
          });
        }
        function U(e) {
          var t = e.byteLength || e.length || e.size;
          if (!Number.isInteger(t)) throw "Failed to determine size of element";
          return t;
        }
        (this.seek = function (e) {
          if (e < 0) throw "Offset may not be negative";
          if (isNaN(e)) throw "Offset may not be NaN";
          if (e > this.length)
            throw "Seeking beyond the end of file is not allowed";
          this.pos = e;
        }),
          (this.write = function (e) {
            var t = { offset: this.pos, data: e, length: U(e) },
              a = t.offset >= this.length;
            (this.pos += t.length),
              (this.length = Math.max(this.length, this.pos)),
              (h = h.then(function () {
                if (T)
                  return new Promise(function (l, y) {
                    L(t.data).then(function (f) {
                      var B = 0,
                        m = Buffer.from(f.buffer),
                        E = function (F, x, A) {
                          (B += x),
                            B >= A.length
                              ? l()
                              : r.write(T, A, B, A.length - B, t.offset + B, E);
                        };
                      r.write(T, m, 0, m.length, t.offset, E);
                    });
                  });
                if (w)
                  return new Promise(function (l, y) {
                    (w.onwriteend = l),
                      w.seek(t.offset),
                      w.write(new Blob([t.data]));
                  });
                if (!a)
                  for (var i = 0; i < d.length; i++) {
                    var c = d[i];
                    if (
                      !(
                        t.offset + t.length <= c.offset ||
                        t.offset >= c.offset + c.length
                      )
                    ) {
                      if (
                        t.offset < c.offset ||
                        t.offset + t.length > c.offset + c.length
                      )
                        throw new Error("Overwrite crosses blob boundaries");
                      if (t.offset == c.offset && t.length == c.length) {
                        c.data = t.data;
                        return;
                      } else
                        return L(c.data)
                          .then(function (l) {
                            return (c.data = l), L(t.data);
                          })
                          .then(function (l) {
                            (t.data = l),
                              c.data.set(t.data, t.offset - c.offset);
                          });
                    }
                  }
                d.push(t);
              }));
          }),
          (this.complete = function (e) {
            return (
              T || w
                ? (h = h.then(function () {
                    return null;
                  }))
                : (h = h.then(function () {
                    for (var t = [], a = 0; a < d.length; a++)
                      t.push(d[a].data);
                    return new Blob(t, { mimeType: e });
                  })),
              h
            );
          });
      };
    })(null);
    window.BlobBuffer = V;
    var k = function (r, s) {
      function d(t, a) {
        var i = {};
        return (
          [t, a].forEach(function (c) {
            for (var l in c)
              Object.prototype.hasOwnProperty.call(c, l) && (i[l] = c[l]);
          }),
          i
        );
      }
      function h(t) {
        return typeof t != "string" || !t.match(/^data:image\/webp;base64,/i)
          ? !1
          : window.atob(t.substring("data:image/webp;base64,".length));
      }
      function w(t) {
        for (
          var a = new ArrayBuffer(t.length), i = new Uint8Array(a), c = 0;
          c < t.length;
          c++
        )
          i[c] = t.charCodeAt(c);
        return a;
      }
      function T(t, a) {
        var i = t.toDataURL("image/webp", { quality: a });
        return h(i);
      }
      function C(t) {
        var a = t.indexOf("VP8 ");
        if (a == -1)
          throw "Failed to identify beginning of keyframe in WebP image";
        return (a += "VP8 ".length + 4), t.substring(a);
      }
      function L(t) {
        this.value = t;
      }
      function U(t) {
        this.value = t;
      }
      function e(t, a, i) {
        if (Array.isArray(i)) for (var c = 0; c < i.length; c++) e(t, a, i[c]);
        else if (typeof i == "string") t.writeString(i);
        else if (i instanceof Uint8Array) t.writeBytes(i);
        else if (i.id)
          if (
            ((i.offset = t.pos + a),
            t.writeUnsignedIntBE(i.id),
            Array.isArray(i.data))
          ) {
            var l, y, f;
            i.size === -1
              ? t.writeByte(255)
              : ((l = t.pos), t.writeBytes([0, 0, 0, 0])),
              (y = t.pos),
              (i.dataOffset = y + a),
              e(t, a, i.data),
              i.size !== -1 &&
                ((f = t.pos),
                (i.size = f - y),
                t.seek(l),
                t.writeEBMLVarIntWidth(i.size, 4),
                t.seek(f));
          } else if (typeof i.data == "string")
            t.writeEBMLVarInt(i.data.length),
              (i.dataOffset = t.pos + a),
              t.writeString(i.data);
          else if (typeof i.data == "number")
            i.size || (i.size = t.measureUnsignedInt(i.data)),
              t.writeEBMLVarInt(i.size),
              (i.dataOffset = t.pos + a),
              t.writeUnsignedIntBE(i.data, i.size);
          else if (i.data instanceof U)
            t.writeEBMLVarInt(8),
              (i.dataOffset = t.pos + a),
              t.writeDoubleBE(i.data.value);
          else if (i.data instanceof L)
            t.writeEBMLVarInt(4),
              (i.dataOffset = t.pos + a),
              t.writeFloatBE(i.data.value);
          else if (i.data instanceof Uint8Array)
            t.writeEBMLVarInt(i.data.byteLength),
              (i.dataOffset = t.pos + a),
              t.writeBytes(i.data);
          else throw "Bad EBML datatype " + typeof i.data;
        else throw "Bad EBML datatype " + typeof i.data;
      }
      return function (t) {
        var a = 5e3,
          i = 1,
          c = !1,
          l,
          y,
          f = [],
          B = 0,
          m = 0,
          E = {
            quality: 0.95,
            fileWriter: null,
            fd: null,
            frameDuration: null,
            frameRate: null,
          },
          F = {
            Cues: {
              id: new Uint8Array([28, 83, 187, 107]),
              positionEBML: null,
            },
            SegmentInfo: {
              id: new Uint8Array([21, 73, 169, 102]),
              positionEBML: null,
            },
            Tracks: {
              id: new Uint8Array([22, 84, 174, 107]),
              positionEBML: null,
            },
          },
          x,
          A = { id: 17545, data: new U(0) },
          D,
          O = [],
          b = new s(t.fileWriter || t.fd);
        function N(o) {
          return o - x.dataOffset;
        }
        function _() {
          var o = { id: 21420, size: 5, data: 0 },
            p = { id: 290298740, data: [] };
          for (var R in F) {
            var I = F[R];
            (I.positionEBML = Object.create(o)),
              p.data.push({
                id: 19899,
                data: [{ id: 21419, data: I.id }, I.positionEBML],
              });
          }
          return p;
        }
        function S() {
          D = _();
          var o = {
              id: 440786851,
              data: [
                { id: 17030, data: 1 },
                { id: 17143, data: 1 },
                { id: 17138, data: 4 },
                { id: 17139, data: 8 },
                { id: 17026, data: "webm" },
                { id: 17031, data: 2 },
                { id: 17029, data: 2 },
              ],
            },
            p = {
              id: 357149030,
              data: [
                { id: 2807729, data: 1e6 },
                { id: 19840, data: "webm-writer-js" },
                { id: 22337, data: "webm-writer-js" },
                A,
              ],
            },
            R = {
              id: 374648427,
              data: [
                {
                  id: 174,
                  data: [
                    { id: 215, data: i },
                    { id: 29637, data: i },
                    { id: 156, data: 0 },
                    { id: 2274716, data: "und" },
                    { id: 134, data: "V_VP8" },
                    { id: 2459272, data: "VP8" },
                    { id: 131, data: 1 },
                    {
                      id: 224,
                      data: [
                        { id: 176, data: l },
                        { id: 186, data: y },
                      ],
                    },
                  ],
                },
              ],
            };
          x = { id: 408125543, size: -1, data: [D, p, R] };
          var I = new r(256);
          e(I, b.pos, [o, x]),
            b.write(I.getAsDataArray()),
            (F.SegmentInfo.positionEBML.data = N(p.offset)),
            (F.Tracks.positionEBML.data = N(R.offset));
        }
        function H(o) {
          var p = new r(1 + 2 + 1);
          if (!(o.trackNumber > 0 && o.trackNumber < 127))
            throw "TrackNumber must be > 0 and < 127";
          return (
            p.writeEBMLVarInt(o.trackNumber),
            p.writeU16BE(o.timecode),
            p.writeByte(1 << 7),
            { id: 163, data: [p.getAsDataArray(), o.frame] }
          );
        }
        function M(o) {
          return {
            id: 524531317,
            data: [{ id: 231, data: Math.round(o.timecode) }],
          };
        }
        function q(o, p, R) {
          O.push({
            id: 187,
            data: [
              { id: 179, data: p },
              {
                id: 183,
                data: [
                  { id: 247, data: o },
                  { id: 241, data: N(R) },
                ],
              },
            ],
          });
        }
        function K() {
          var o = { id: 475249515, data: O },
            p = new r(16 + O.length * 32);
          e(p, b.pos, o),
            b.write(p.getAsDataArray()),
            (F.Cues.positionEBML.data = N(o.offset));
        }
        function G() {
          if (f.length != 0) {
            for (var o = 0, p = 0; p < f.length; p++) o += f[p].frame.length;
            for (
              var R = new r(o + f.length * 32),
                I = M({ timecode: Math.round(B) }),
                p = 0;
              p < f.length;
              p++
            )
              I.data.push(H(f[p]));
            e(R, b.pos, I),
              b.write(R.getAsDataArray()),
              q(i, Math.round(B), I.offset),
              (f = []),
              (B += m),
              (m = 0);
          }
        }
        function X() {
          if (!t.frameDuration)
            if (t.frameRate) t.frameDuration = 1e3 / t.frameRate;
            else throw "Missing required frameDuration or frameRate setting";
        }
        function J(o) {
          (o.trackNumber = i),
            (o.timecode = Math.round(m)),
            f.push(o),
            (m += o.duration),
            m >= a && G();
        }
        function Z() {
          var o = new r(D.size),
            p = b.pos;
          e(o, D.dataOffset, D.data),
            b.seek(D.dataOffset),
            b.write(o.getAsDataArray()),
            b.seek(p);
        }
        function $() {
          var o = new r(8),
            p = b.pos;
          o.writeDoubleBE(B),
            b.seek(A.dataOffset),
            b.write(o.getAsDataArray()),
            b.seek(p);
        }
        (this.addFrame = function (o) {
          if (c) {
            if (o.width != l || o.height != y)
              throw "Frame size differs from previous frames";
          } else (l = o.width), (y = o.height), S(), (c = !0);
          var p = T(o, { quality: t.quality });
          if (!p)
            throw "Couldn't decode WebP frame, does the browser support WebP?";
          J({ frame: C(p), duration: t.frameDuration });
        }),
          (this.complete = function () {
            return G(), K(), Z(), $(), b.complete("video/webm");
          }),
          (this.getWrittenSize = function () {
            return b.length;
          }),
          (t = d(E, t || {})),
          X();
      };
    };
    window.WebMWriter = k(g, V);
  })();
  (function () {
    window.download = function (z, g, V) {
      var k = window,
        r = "application/octet-stream",
        s = V || r,
        d = z,
        h = !g && !V && d,
        w = document.createElement("a"),
        T = function (f) {
          return String(f);
        },
        C = k.Blob || k.MozBlob || k.WebKitBlob || T,
        L = g || "download",
        U,
        e;
      if (
        ((C = C.call ? C.bind(k) : Blob),
        String(this) === "true" && ((d = [d, s]), (s = d[0]), (d = d[1])),
        h &&
          h.length < 2048 &&
          ((L = h.split("/").pop().split("?")[0]),
          (w.href = h),
          w.href.indexOf(h) !== -1))
      ) {
        var t = new XMLHttpRequest();
        return (
          t.open("GET", h, !0),
          (t.responseType = "blob"),
          (t.onload = function (f) {
            download(f.target.response, L, r);
          }),
          setTimeout(function () {
            t.send();
          }, 0),
          t
        );
      }
      if (/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(d))
        if (d.length > 1024 * 1024 * 1.999 && C !== T)
          (d = l(d)), (s = d.type || r);
        else return navigator.msSaveBlob ? navigator.msSaveBlob(l(d), L) : y(d);
      else if (/([\x80-\xff])/.test(d)) {
        var a = 0,
          i = new Uint8Array(d.length),
          c = i.length;
        for (a; a < c; ++a) i[a] = d.charCodeAt(a);
        d = new C([i], { type: s });
      }
      U = d instanceof C ? d : new C([d], { type: s });
      function l(f) {
        var B = f.split(/[:;,]/),
          m = B[1],
          E = f.indexOf("charset") > 0 ? 3 : 2,
          F = B[E] == "base64" ? atob : decodeURIComponent,
          x = F(B.pop()),
          A = x.length,
          D = 0,
          O = new Uint8Array(A);
        for (D; D < A; ++D) O[D] = x.charCodeAt(D);
        return new C([O], { type: m });
      }
      function y(f, B) {
        if ("download" in w)
          return (
            (w.href = f),
            w.setAttribute("download", L),
            (w.className = "download-js-link"),
            (w.innerHTML = "downloading..."),
            (w.style.display = "none"),
            w.addEventListener("click", function (E) {
              E.stopPropagation(),
                this.removeEventListener("click", arguments.callee);
            }),
            document.body.appendChild(w),
            setTimeout(function () {
              w.click(),
                document.body.removeChild(w),
                B === !0 &&
                  setTimeout(function () {
                    k.URL.revokeObjectURL(w.href);
                  }, 250);
            }, 66),
            !0
          );
        if (
          /(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(
            navigator.userAgent
          )
        )
          return (
            /^data:/.test(f) &&
              (f = "data:" + f.replace(/^data:([\w\/\-\+]+)/, r)),
            window.open(f) ||
              (confirm(`Displaying New Document

Use Save As... to download, then click back to return to this page.`) &&
                (location.href = f)),
            !0
          );
        var m = document.createElement("iframe");
        document.body.appendChild(m),
          !B &&
            /^data:/.test(f) &&
            (f = "data:" + f.replace(/^data:([\w\/\-\+]+)/, r)),
          (m.src = f),
          setTimeout(function () {
            document.body.removeChild(m);
          }, 333);
      }
      if (navigator.msSaveBlob) return navigator.msSaveBlob(U, L);
      if (k.URL) y(k.URL.createObjectURL(U), !0);
      else {
        if (typeof U == "string" || U.constructor === T)
          try {
            return y("data:" + s + ";base64," + k.btoa(U));
          } catch (f) {
            return y("data:" + s + "," + encodeURIComponent(U));
          }
        (e = new FileReader()),
          (e.onload = function (f) {
            y(this.result);
          }),
          e.readAsDataURL(U);
      }
      return !0;
    };
  })();
  (function () {
    "use strict";
    var z = window.Tar,
      g = window.download,
      V = window.GIF,
      k = window.WebMWriter;
    "gc" in window || (window.gc = function () {}),
      HTMLCanvasElement.prototype.toBlob ||
        Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
          value: function (e, t, a) {
            for (
              var i = atob(this.toDataURL(t, a).split(",")[1]),
                c = i.length,
                l = new Uint8Array(c),
                y = 0;
              y < c;
              y++
            )
              l[y] = i.charCodeAt(y);
            e(new Blob([l], { type: t || "image/png" }));
          },
        });
    (function () {
      if (
        ("performance" in window || (window.performance = {}),
        !("now" in window.performance))
      ) {
        var e = Date.now();
        window.performance.now = function () {
          return Date.now() - e;
        };
      }
    })();
    function r(e) {
      return String("0000000" + e).slice(-7);
    }
    var s = window.Date.now();
    function d() {
      function e() {
        return Math.floor((1 + Math.random()) * 65536)
          .toString(16)
          .substring(1);
      }
      return (
        e() + e() + "-" + e() + "-" + e() + "-" + e() + "-" + e() + e() + e()
      );
    }
    function h(e) {
      var t = {};
      (this.settings = e),
        (this.on = function (a, i) {
          t[a] = i;
        }),
        (this.emit = function (a) {
          var i = t[a];
          i && i.apply(null, Array.prototype.slice.call(arguments, 1));
        }),
        (this.filename = e.name || d()),
        (this.extension = ""),
        (this.mimeType = "");
    }
    (h.prototype.start = function () {}),
      (h.prototype.stop = function () {}),
      (h.prototype.add = function () {}),
      (h.prototype.save = function () {}),
      (h.prototype.dispose = function () {}),
      (h.prototype.safeToProceed = function () {
        return !0;
      }),
      (h.prototype.step = function () {
        console.log("Step not set!");
      });
    function w(e) {
      var t = document.createElement("canvas");
      h.call(this, e),
        (this.quality = e.quality / 100 || 0.8),
        (this.extension = ".webm"),
        (this.mimeType = "video/webm"),
        (this.baseFilename = this.filename),
        (this.framerate = e.framerate),
        (this.frames = 0),
        (this.part = 1),
        (this.videoWriter = new k({
          quality: this.quality,
          fileWriter: null,
          fd: null,
          frameRate: this.framerate,
        }));
    }
    (w.prototype = Object.create(h.prototype)),
      (w.prototype.start = function (e) {
        this.dispose();
      }),
      (w.prototype.add = function (e) {
        this.videoWriter.addFrame(e),
          this.settings.autoSaveTime > 0 &&
          this.frames / this.settings.framerate >= this.settings.autoSaveTime
            ? this.save(
                function (t) {
                  (this.filename = this.baseFilename + "-part-" + r(this.part)),
                    g(t, this.filename + this.extension, this.mimeType),
                    this.dispose(),
                    this.part++,
                    (this.filename =
                      this.baseFilename + "-part-" + r(this.part)),
                    this.step();
                }.bind(this)
              )
            : (this.frames++, this.step());
      }),
      (w.prototype.save = function (e) {
        this.videoWriter.complete().then(e);
      }),
      (w.prototype.dispose = function (e) {
        (this.frames = 0),
          (this.videoWriter = new k({
            quality: this.quality,
            fileWriter: null,
            fd: null,
            frameRate: this.framerate,
          }));
      });
    function T(e) {
      h.call(this, e),
        (e.quality = e.quality / 100 || 0.8),
        (this.encoder = new FFMpegServer.Video(e)),
        this.encoder.on(
          "process",
          function () {
            this.emit("process");
          }.bind(this)
        ),
        this.encoder.on(
          "finished",
          function (t, a) {
            var i = this.callback;
            i && ((this.callback = void 0), i(t, a));
          }.bind(this)
        ),
        this.encoder.on(
          "progress",
          function (t) {
            this.settings.onProgress && this.settings.onProgress(t);
          }.bind(this)
        ),
        this.encoder.on(
          "error",
          function (t) {
            alert(JSON.stringify(t, null, 2));
          }.bind(this)
        );
    }
    (T.prototype = Object.create(h.prototype)),
      (T.prototype.start = function () {
        this.encoder.start(this.settings);
      }),
      (T.prototype.add = function (e) {
        this.encoder.add(e);
      }),
      (T.prototype.save = function (e) {
        (this.callback = e), this.encoder.end();
      }),
      (T.prototype.safeToProceed = function () {
        return this.encoder.safeToProceed();
      });
    function C(e) {
      h.call(this, e),
        (this.framerate = this.settings.framerate),
        (this.type = "video/webm"),
        (this.extension = ".webm"),
        (this.stream = null),
        (this.mediaRecorder = null),
        (this.chunks = []);
    }
    (C.prototype = Object.create(h.prototype)),
      (C.prototype.add = function (e) {
        this.stream ||
          ((this.stream = e.captureStream(this.framerate)),
          (this.mediaRecorder = new MediaRecorder(this.stream)),
          this.mediaRecorder.start(),
          (this.mediaRecorder.ondataavailable = function (t) {
            this.chunks.push(t.data);
          }.bind(this))),
          this.step();
      }),
      (C.prototype.save = function (e) {
        (this.mediaRecorder.onstop = function (t) {
          var a = new Blob(this.chunks, { type: "video/webm" });
          (this.chunks = []), e(a);
        }.bind(this)),
          this.mediaRecorder.stop();
      });
    function L(e) {
      h.call(this, e),
        (e.quality = 31 - ((e.quality * 30) / 100 || 10)),
        (e.workers = e.workers || 4),
        (this.extension = ".gif"),
        (this.mimeType = "image/gif"),
        (this.canvas = document.createElement("canvas")),
        (this.ctx = this.canvas.getContext("2d")),
        (this.sizeSet = !1),
        (this.encoder = new V({
          workers: e.workers,
          quality: e.quality,
          workerScript: e.workersPath + "gif.worker.js",
        })),
        this.encoder.on(
          "progress",
          function (t) {
            this.settings.onProgress && this.settings.onProgress(t);
          }.bind(this)
        ),
        this.encoder.on(
          "finished",
          function (t) {
            var a = this.callback;
            a && ((this.callback = void 0), a(t));
          }.bind(this)
        );
    }
    (L.prototype = Object.create(h.prototype)),
      (L.prototype.add = function (e) {
        this.sizeSet ||
          (this.encoder.setOption("width", e.width),
          this.encoder.setOption("height", e.height),
          (this.sizeSet = !0)),
          (this.canvas.width = e.width),
          (this.canvas.height = e.height),
          this.ctx.drawImage(e, 0, 0),
          this.encoder.addFrame(this.ctx, {
            copy: !0,
            delay: this.settings.step,
          }),
          this.step();
      }),
      (L.prototype.save = function (e) {
        (this.callback = e), this.encoder.render();
      });
    function U(e) {
      var t = e || {},
        a = new Date(),
        i,
        c,
        l,
        y,
        f,
        B,
        j,
        m,
        E = [],
        F = [],
        x = 0,
        A = 0,
        D = null,
        O = [],
        b = !1,
        N = {};
      (t.framerate = t.framerate || 60),
        (t.motionBlurFrames = 2 * (t.motionBlurFrames || 1)),
        (i = t.verbose || !1),
        (c = t.display || !1),
        (t.step = 1e3 / t.framerate),
        (t.timeLimit = t.timeLimit || 0),
        (t.frameLimit = t.frameLimit || 0),
        (t.startTime = t.startTime || 0);
      var _ = document.createElement("div");
      (_.style.position = "absolute"),
        (_.style.left = _.style.top = 0),
        (_.style.backgroundColor = "black"),
        (_.style.fontFamily = "monospace"),
        (_.style.fontSize = "11px"),
        (_.style.padding = "5px"),
        (_.style.color = "red"),
        (_.style.zIndex = 1e5),
        t.display && document.body.appendChild(_);
      var S = document.createElement("canvas"),
        H = S.getContext("2d"),
        M,
        q;
      W("Step is set to " + t.step + "ms");
      var K = { webm: w, "webm-mediarecorder": C },
        G = K[t.format];
      if (!G)
        throw (
          "Error: Incorrect or missing format: Valid formats are " +
          Object.keys(K).join(", ")
        );
      if (
        ((m = new G(t)),
        (m.step = j),
        m.on("process", it),
        m.on("progress", wt),
        "performance" in window || (window.performance = {}),
        (Date.now =
          Date.now ||
          function () {
            return new Date().getTime();
          }),
        !("now" in window.performance))
      ) {
        var X = Date.now();
        performance.timing &&
          performance.timing.navigationStart &&
          (X = performance.timing.navigationStart),
          (window.performance.now = function () {
            return Date.now() - X;
          });
      }
      var J = window.setTimeout,
        Z = window.setInterval,
        $ = window.clearInterval,
        o = window.clearTimeout,
        p = window.requestAnimationFrame,
        R = window.Date.now,
        I = window.performance.now,
        nt = window.Date.prototype.getTime,
        tt = [];
      function at() {
        W("Capturer start"),
          (y = window.Date.now()),
          (l = y + t.startTime),
          (B = window.performance.now()),
          (f = B + t.startTime),
          (window.Date.prototype.getTime = function () {
            return l;
          }),
          (window.Date.now = function () {
            return l;
          }),
          (window.setTimeout = function (n, v) {
            var P = { callback: n, time: v, triggerTime: l + v };
            return E.push(P), W("Timeout set to " + P.time), P;
          }),
          (window.clearTimeout = function (n) {
            for (var v = 0; v < E.length; v++)
              if (E[v] == n) {
                E.splice(v, 1), W("Timeout cleared");
                continue;
              }
          }),
          (window.setInterval = function (n, v) {
            var P = { callback: n, time: v, triggerTime: l + v };
            return F.push(P), W("Interval set to " + P.time), P;
          }),
          (window.clearInterval = function (n) {
            return W("clear Interval"), null;
          }),
          (window.requestAnimationFrame = function (n) {
            O.push(n);
          }),
          (window.performance.now = function () {
            return f;
          });
        function u() {
          return (
            this._hooked ||
              ((this._hooked = !0),
              (this._hookedTime = this.currentTime || 0),
              this.pause(),
              tt.push(this)),
            this._hookedTime + t.startTime
          );
        }
        try {
          Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
            get: u,
          }),
            Object.defineProperty(HTMLAudioElement.prototype, "currentTime", {
              get: u,
            });
        } catch (n) {
          W(n);
        }
      }
      function ot() {
        at(), m.start(), (b = !0);
      }
      function et() {
        (b = !1), m.stop(), st();
      }
      function Q(u, n) {
        J(u, 0, n);
      }
      function j() {
        Q(it);
      }
      function st() {
        W("Capturer stop"),
          (window.setTimeout = J),
          (window.setInterval = Z),
          (window.clearInterval = $),
          (window.clearTimeout = o),
          (window.requestAnimationFrame = p),
          (window.Date.prototype.getTime = nt),
          (window.Date.now = R),
          (window.performance.now = I);
      }
      function dt() {
        var u = x / t.framerate;
        ((t.frameLimit && x >= t.frameLimit) ||
          (t.timeLimit && u >= t.timeLimit)) &&
          (et(), rt());
        var n = new Date(null);
        n.setSeconds(u),
          t.motionBlurFrames > 2
            ? (_.textContent =
                "CCapture " +
                t.format +
                " | " +
                x +
                " frames (" +
                A +
                " inter) | " +
                n.toISOString().substr(11, 8))
            : (_.textContent =
                "CCapture " +
                t.format +
                " | " +
                x +
                " frames | " +
                n.toISOString().substr(11, 8));
      }
      function ft(u) {
        (S.width !== u.width || S.height !== u.height) &&
          ((S.width = u.width),
          (S.height = u.height),
          (M = new Uint16Array(S.height * S.width * 4)),
          (H.fillStyle = "#0"),
          H.fillRect(0, 0, S.width, S.height));
      }
      function ut(u) {
        H.drawImage(u, 0, 0), (q = H.getImageData(0, 0, S.width, S.height));
        for (var n = 0; n < M.length; n += 4)
          (M[n] += q.data[n]),
            (M[n + 1] += q.data[n + 1]),
            (M[n + 2] += q.data[n + 2]);
        A++;
      }
      function ct() {
        for (var u = q.data, n = 0; n < M.length; n += 4)
          (u[n] = (M[n] * 2) / t.motionBlurFrames),
            (u[n + 1] = (M[n + 1] * 2) / t.motionBlurFrames),
            (u[n + 2] = (M[n + 2] * 2) / t.motionBlurFrames);
        H.putImageData(q, 0, 0),
          m.add(S),
          x++,
          (A = 0),
          W("Full MB Frame! " + x + " " + l);
        for (var n = 0; n < M.length; n += 4)
          (M[n] = 0), (M[n + 1] = 0), (M[n + 2] = 0);
        gc();
      }
      function lt(u) {
        b &&
          (t.motionBlurFrames > 2
            ? (ft(u), ut(u), A >= 0.5 * t.motionBlurFrames ? ct() : j())
            : (m.add(u), x++, W("Full Frame! " + x)));
      }
      function it() {
        var u = 1e3 / t.framerate,
          n = (x + A / t.motionBlurFrames) * u;
        (l = y + n),
          (f = B + n),
          tt.forEach(function (P) {
            P._hookedTime = n / 1e3;
          }),
          dt(),
          W("Frame: " + x + " " + A);
        for (var v = 0; v < E.length; v++)
          if (l >= E[v].triggerTime) {
            Q(E[v].callback), E.splice(v, 1);
            continue;
          }
        for (var v = 0; v < F.length; v++)
          if (l >= F[v].triggerTime) {
            Q(F[v].callback), (F[v].triggerTime += F[v].time);
            continue;
          }
        O.forEach(function (P) {
          Q(P, l - s);
        }),
          (O = []);
      }
      function rt(u) {
        u ||
          (u = function (n) {
            return g(n, m.filename + m.extension, m.mimeType), !1;
          }),
          m.save(u);
      }
      function W(u) {
        i && console.log(u);
      }
      function ht(u, n) {
        N[u] = n;
      }
      function pt(u) {
        var n = N[u];
        n && n.apply(null, Array.prototype.slice.call(arguments, 1));
      }
      function wt(u) {
        pt("progress", u);
      }
      return { start: ot, capture: lt, stop: et, save: rt, on: ht };
    }
    window.CCapture = U;
  })();
  var Y = class {
    constructor() {
      (this.active = !1), (this.running = !1);
    }
    enableCapture({ frameCount: g, element: V, onComplete: k }) {
      (this.active = !0),
        (this.el = V),
        (this.maxFrames = g),
        (this.frames = 0),
        (this.capture = new window.CCapture({
          framerate: 60,
          format: "webm",
          verbose: !1,
        })),
        (this.onComplete = k || function () {});
    }
    captureFrame() {
      this.active &&
        !this.running &&
        (this.capture.start(), (this.running = !0)),
        this.active &&
          (this.capture.capture(this.el),
          this.frames++,
          this.frames > this.maxFrames &&
            (this.capture.stop(), this.capture.save(), this.onComplete()));
    }
  };
  if (window) {
    let z = new Y();
    (window.enableCapture = z.enableCapture.bind(z)),
      (window.captureFrame = z.captureFrame.bind(z));
  }
})();
// @license http://opensource.org/licenses/MIT
