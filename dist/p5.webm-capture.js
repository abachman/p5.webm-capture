(() => {
  // src/vendor/webm-writer-0.3.0.js
  (function() {
    let ArrayBufferDataStream = function(length) {
      this.data = new Uint8Array(length);
      this.pos = 0;
    };
    ArrayBufferDataStream.prototype.seek = function(toOffset) {
      this.pos = toOffset;
    };
    ArrayBufferDataStream.prototype.writeBytes = function(arr) {
      for (let i = 0; i < arr.length; i++) {
        this.data[this.pos++] = arr[i];
      }
    };
    ArrayBufferDataStream.prototype.writeByte = function(b) {
      this.data[this.pos++] = b;
    };
    ArrayBufferDataStream.prototype.writeU8 = ArrayBufferDataStream.prototype.writeByte;
    ArrayBufferDataStream.prototype.writeU16BE = function(u) {
      this.data[this.pos++] = u >> 8;
      this.data[this.pos++] = u;
    };
    ArrayBufferDataStream.prototype.writeDoubleBE = function(d) {
      let bytes = new Uint8Array(new Float64Array([d]).buffer);
      for (let i = bytes.length - 1; i >= 0; i--) {
        this.writeByte(bytes[i]);
      }
    };
    ArrayBufferDataStream.prototype.writeFloatBE = function(d) {
      let bytes = new Uint8Array(new Float32Array([d]).buffer);
      for (let i = bytes.length - 1; i >= 0; i--) {
        this.writeByte(bytes[i]);
      }
    };
    ArrayBufferDataStream.prototype.writeString = function(s) {
      for (let i = 0; i < s.length; i++) {
        this.data[this.pos++] = s.charCodeAt(i);
      }
    };
    ArrayBufferDataStream.prototype.writeEBMLVarIntWidth = function(i, width) {
      switch (width) {
        case 1:
          this.writeU8(1 << 7 | i);
          break;
        case 2:
          this.writeU8(1 << 6 | i >> 8);
          this.writeU8(i);
          break;
        case 3:
          this.writeU8(1 << 5 | i >> 16);
          this.writeU8(i >> 8);
          this.writeU8(i);
          break;
        case 4:
          this.writeU8(1 << 4 | i >> 24);
          this.writeU8(i >> 16);
          this.writeU8(i >> 8);
          this.writeU8(i);
          break;
        case 5:
          this.writeU8(1 << 3 | i / 4294967296 & 7);
          this.writeU8(i >> 24);
          this.writeU8(i >> 16);
          this.writeU8(i >> 8);
          this.writeU8(i);
          break;
        default:
          throw new Error("Bad EBML VINT size " + width);
      }
    };
    ArrayBufferDataStream.prototype.measureEBMLVarInt = function(val) {
      if (val < (1 << 7) - 1) {
        return 1;
      } else if (val < (1 << 14) - 1) {
        return 2;
      } else if (val < (1 << 21) - 1) {
        return 3;
      } else if (val < (1 << 28) - 1) {
        return 4;
      } else if (val < 34359738367) {
        return 5;
      } else {
        throw new Error("EBML VINT size not supported " + val);
      }
    };
    ArrayBufferDataStream.prototype.writeEBMLVarInt = function(i) {
      this.writeEBMLVarIntWidth(i, this.measureEBMLVarInt(i));
    };
    ArrayBufferDataStream.prototype.writeUnsignedIntBE = function(u, width) {
      if (width === void 0) {
        width = this.measureUnsignedInt(u);
      }
      switch (width) {
        case 5:
          this.writeU8(Math.floor(u / 4294967296));
        case 4:
          this.writeU8(u >> 24);
        case 3:
          this.writeU8(u >> 16);
        case 2:
          this.writeU8(u >> 8);
        case 1:
          this.writeU8(u);
          break;
        default:
          throw new Error("Bad UINT size " + width);
      }
    };
    ArrayBufferDataStream.prototype.measureUnsignedInt = function(val) {
      if (val < 1 << 8) {
        return 1;
      } else if (val < 1 << 16) {
        return 2;
      } else if (val < 1 << 24) {
        return 3;
      } else if (val < 4294967296) {
        return 4;
      } else {
        return 5;
      }
    };
    ArrayBufferDataStream.prototype.getAsDataArray = function() {
      if (this.pos < this.data.byteLength) {
        return this.data.subarray(0, this.pos);
      } else if (this.pos == this.data.byteLength) {
        return this.data;
      } else {
        throw new Error("ArrayBufferDataStream's pos lies beyond end of buffer");
      }
    };
    window.ArrayBufferDataStream = ArrayBufferDataStream;
  })();
  (function() {
    let BlobBuffer = function(fs) {
      return function(destination) {
        let buffer = [], writePromise = Promise.resolve(), fileWriter = null, fd = null;
        if (destination && destination.constructor.name === "FileWriter") {
          fileWriter = destination;
        } else if (fs && destination) {
          fd = destination;
        }
        if (!fs && fileWriter == null && fd == null) {
          console.error("unable to write!");
        }
        this.pos = 0;
        this.length = 0;
        function readBlobAsBuffer(blob) {
          return new Promise(function(resolve, reject) {
            let reader = new FileReader();
            reader.addEventListener("loadend", function() {
              resolve(reader.result);
            });
            reader.readAsArrayBuffer(blob);
          });
        }
        function convertToUint8Array(thing) {
          return new Promise(function(resolve, reject) {
            if (thing instanceof Uint8Array) {
              resolve(thing);
            } else if (thing instanceof ArrayBuffer || ArrayBuffer.isView(thing)) {
              resolve(new Uint8Array(thing));
            } else if (thing instanceof Blob) {
              resolve(readBlobAsBuffer(thing).then(function(buffer2) {
                return new Uint8Array(buffer2);
              }));
            } else {
              resolve(readBlobAsBuffer(new Blob([thing])).then(function(buffer2) {
                return new Uint8Array(buffer2);
              }));
            }
          });
        }
        function measureData(data) {
          let result = data.byteLength || data.length || data.size;
          if (!Number.isInteger(result)) {
            throw new Error("Failed to determine size of element");
          }
          return result;
        }
        this.seek = function(offset) {
          if (offset < 0) {
            throw new Error("Offset may not be negative");
          }
          if (isNaN(offset)) {
            throw new Error("Offset may not be NaN");
          }
          if (offset > this.length) {
            throw new Error("Seeking beyond the end of file is not allowed");
          }
          this.pos = offset;
        };
        this.write = function(data) {
          let newEntry = {
            offset: this.pos,
            data,
            length: measureData(data)
          }, isAppend = newEntry.offset >= this.length;
          this.pos += newEntry.length;
          this.length = Math.max(this.length, this.pos);
          writePromise = writePromise.then(function() {
            if (fd) {
              return new Promise(function(resolve, reject) {
                convertToUint8Array(newEntry.data).then(function(dataArray) {
                  let totalWritten = 0, buffer2 = Buffer.from(dataArray.buffer), handleWriteComplete = function(err, written, buffer3) {
                    totalWritten += written;
                    if (totalWritten >= buffer3.length) {
                      resolve();
                    } else {
                      fs.write(fd, buffer3, totalWritten, buffer3.length - totalWritten, newEntry.offset + totalWritten, handleWriteComplete);
                    }
                  };
                  fs.write(fd, buffer2, 0, buffer2.length, newEntry.offset, handleWriteComplete);
                });
              });
            } else if (fileWriter) {
              return new Promise(function(resolve, reject) {
                fileWriter.onwriteend = resolve;
                fileWriter.seek(newEntry.offset);
                fileWriter.write(new Blob([newEntry.data]));
              });
            } else if (!isAppend) {
              for (let i = 0; i < buffer.length; i++) {
                let entry = buffer[i];
                if (!(newEntry.offset + newEntry.length <= entry.offset || newEntry.offset >= entry.offset + entry.length)) {
                  if (newEntry.offset < entry.offset || newEntry.offset + newEntry.length > entry.offset + entry.length) {
                    throw new Error("Overwrite crosses blob boundaries");
                  }
                  if (newEntry.offset == entry.offset && newEntry.length == entry.length) {
                    entry.data = newEntry.data;
                    return;
                  } else {
                    return convertToUint8Array(entry.data).then(function(entryArray) {
                      entry.data = entryArray;
                      return convertToUint8Array(newEntry.data);
                    }).then(function(newEntryArray) {
                      newEntry.data = newEntryArray;
                      entry.data.set(newEntry.data, newEntry.offset - entry.offset);
                    });
                  }
                }
              }
            }
            buffer.push(newEntry);
          });
        };
        this.complete = function(mimeType) {
          if (fd || fileWriter) {
            writePromise = writePromise.then(function() {
              return null;
            });
          } else {
            writePromise = writePromise.then(function() {
              let result = [];
              for (let i = 0; i < buffer.length; i++) {
                result.push(buffer[i].data);
              }
              return new Blob(result, { type: mimeType });
            });
          }
          return writePromise;
        };
      };
    };
    window.BlobBuffer = BlobBuffer(null);
  })();
  (function() {
    function extend(base, top) {
      let target = {};
      [base, top].forEach(function(obj) {
        for (let prop in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            target[prop] = obj[prop];
          }
        }
      });
      return target;
    }
    function decodeBase64WebPDataURL(url) {
      if (typeof url !== "string" || !url.match(/^data:image\/webp;base64,/i)) {
        throw new Error("Failed to decode WebP Base64 URL");
      }
      return window.atob(url.substring("data:image/webp;base64,".length));
    }
    function renderAsWebP(canvas, quality) {
      let frame = typeof canvas === "string" && /^data:image\/webp/.test(canvas) ? canvas : canvas.toDataURL("image/webp", quality);
      return decodeBase64WebPDataURL(frame);
    }
    function byteStringToUint32LE(string) {
      let a = string.charCodeAt(0), b = string.charCodeAt(1), c = string.charCodeAt(2), d = string.charCodeAt(3);
      return (a | b << 8 | c << 16 | d << 24) >>> 0;
    }
    function extractKeyframeFromWebP(webP) {
      let cursor = webP.indexOf("VP8", 12);
      if (cursor === -1) {
        throw new Error("Bad image format, does this browser support WebP?");
      }
      let hasAlpha = false;
      while (cursor < webP.length - 8) {
        let chunkLength, fourCC;
        fourCC = webP.substring(cursor, cursor + 4);
        cursor += 4;
        chunkLength = byteStringToUint32LE(webP.substring(cursor, cursor + 4));
        cursor += 4;
        switch (fourCC) {
          case "VP8 ":
            return {
              frame: webP.substring(cursor, cursor + chunkLength),
              hasAlpha
            };
          case "ALPH":
            hasAlpha = true;
            break;
        }
        cursor += chunkLength;
        if ((chunkLength & 1) !== 0) {
          cursor++;
        }
      }
      throw new Error("Failed to find VP8 keyframe in WebP image, is this image mistakenly encoded in the Lossless WebP format?");
    }
    function EBMLFloat32(value) {
      this.value = value;
    }
    function EBMLFloat64(value) {
      this.value = value;
    }
    function writeEBML(buffer, bufferFileOffset, ebml) {
      if (Array.isArray(ebml)) {
        for (let i = 0; i < ebml.length; i++) {
          writeEBML(buffer, bufferFileOffset, ebml[i]);
        }
      } else if (typeof ebml === "string") {
        buffer.writeString(ebml);
      } else if (ebml instanceof Uint8Array) {
        buffer.writeBytes(ebml);
      } else if (ebml.id) {
        ebml.offset = buffer.pos + bufferFileOffset;
        buffer.writeUnsignedIntBE(ebml.id);
        if (Array.isArray(ebml.data)) {
          let sizePos, dataBegin, dataEnd;
          if (ebml.size === -1) {
            buffer.writeByte(255);
          } else {
            sizePos = buffer.pos;
            buffer.writeBytes([0, 0, 0, 0]);
          }
          dataBegin = buffer.pos;
          ebml.dataOffset = dataBegin + bufferFileOffset;
          writeEBML(buffer, bufferFileOffset, ebml.data);
          if (ebml.size !== -1) {
            dataEnd = buffer.pos;
            ebml.size = dataEnd - dataBegin;
            buffer.seek(sizePos);
            buffer.writeEBMLVarIntWidth(ebml.size, 4);
            buffer.seek(dataEnd);
          }
        } else if (typeof ebml.data === "string") {
          buffer.writeEBMLVarInt(ebml.data.length);
          ebml.dataOffset = buffer.pos + bufferFileOffset;
          buffer.writeString(ebml.data);
        } else if (typeof ebml.data === "number") {
          if (!ebml.size) {
            ebml.size = buffer.measureUnsignedInt(ebml.data);
          }
          buffer.writeEBMLVarInt(ebml.size);
          ebml.dataOffset = buffer.pos + bufferFileOffset;
          buffer.writeUnsignedIntBE(ebml.data, ebml.size);
        } else if (ebml.data instanceof EBMLFloat64) {
          buffer.writeEBMLVarInt(8);
          ebml.dataOffset = buffer.pos + bufferFileOffset;
          buffer.writeDoubleBE(ebml.data.value);
        } else if (ebml.data instanceof EBMLFloat32) {
          buffer.writeEBMLVarInt(4);
          ebml.dataOffset = buffer.pos + bufferFileOffset;
          buffer.writeFloatBE(ebml.data.value);
        } else if (ebml.data instanceof Uint8Array) {
          buffer.writeEBMLVarInt(ebml.data.byteLength);
          ebml.dataOffset = buffer.pos + bufferFileOffset;
          buffer.writeBytes(ebml.data);
        } else {
          throw new Error("Bad EBML datatype " + typeof ebml.data);
        }
      } else {
        throw new Error("Bad EBML datatype " + typeof ebml.data);
      }
    }
    let WebMWriter = function(ArrayBufferDataStream, BlobBuffer) {
      return function(options) {
        let MAX_CLUSTER_DURATION_MSEC = 5e3, DEFAULT_TRACK_NUMBER = 1, writtenHeader = false, videoWidth = 0, videoHeight = 0, alphaBuffer = null, alphaBufferContext = null, alphaBufferData = null, clusterFrameBuffer = [], clusterStartTime = 0, clusterDuration = 0, optionDefaults = {
          quality: 0.95,
          transparent: false,
          alphaQuality: void 0,
          fileWriter: null,
          fd: null,
          frameDuration: null,
          frameRate: null
        }, seekPoints = {
          Cues: {
            id: new Uint8Array([28, 83, 187, 107]),
            positionEBML: null
          },
          SegmentInfo: {
            id: new Uint8Array([21, 73, 169, 102]),
            positionEBML: null
          },
          Tracks: {
            id: new Uint8Array([22, 84, 174, 107]),
            positionEBML: null
          }
        }, ebmlSegment, segmentDuration = {
          id: 17545,
          data: new EBMLFloat64(0)
        }, seekHead, cues = [], blobBuffer = new BlobBuffer(options.fileWriter || options.fd);
        function fileOffsetToSegmentRelative(fileOffset) {
          return fileOffset - ebmlSegment.dataOffset;
        }
        function convertAlphaToGrayscaleImage(source) {
          if (alphaBuffer === null || alphaBuffer.width !== source.width || alphaBuffer.height !== source.height) {
            alphaBuffer = document.createElement("canvas");
            alphaBuffer.width = source.width;
            alphaBuffer.height = source.height;
            alphaBufferContext = alphaBuffer.getContext("2d");
            alphaBufferData = alphaBufferContext.createImageData(alphaBuffer.width, alphaBuffer.height);
          }
          let sourceContext = source.getContext("2d"), sourceData = sourceContext.getImageData(0, 0, source.width, source.height).data, destData = alphaBufferData.data, dstCursor = 0, srcEnd = source.width * source.height * 4;
          for (let srcCursor = 3; srcCursor < srcEnd; srcCursor += 4) {
            let alpha = sourceData[srcCursor];
            destData[dstCursor++] = alpha;
            destData[dstCursor++] = alpha;
            destData[dstCursor++] = alpha;
            destData[dstCursor++] = 255;
          }
          alphaBufferContext.putImageData(alphaBufferData, 0, 0);
          return alphaBuffer;
        }
        function createSeekHead() {
          let seekPositionEBMLTemplate = {
            id: 21420,
            size: 5,
            data: 0
          }, result = {
            id: 290298740,
            data: []
          };
          for (let name in seekPoints) {
            let seekPoint = seekPoints[name];
            seekPoint.positionEBML = Object.create(seekPositionEBMLTemplate);
            result.data.push({
              id: 19899,
              data: [
                {
                  id: 21419,
                  data: seekPoint.id
                },
                seekPoint.positionEBML
              ]
            });
          }
          return result;
        }
        function writeHeader() {
          seekHead = createSeekHead();
          let ebmlHeader = {
            id: 440786851,
            data: [
              {
                id: 17030,
                data: 1
              },
              {
                id: 17143,
                data: 1
              },
              {
                id: 17138,
                data: 4
              },
              {
                id: 17139,
                data: 8
              },
              {
                id: 17026,
                data: "webm"
              },
              {
                id: 17031,
                data: 2
              },
              {
                id: 17029,
                data: 2
              }
            ]
          }, segmentInfo = {
            id: 357149030,
            data: [
              {
                id: 2807729,
                data: 1e6
              },
              {
                id: 19840,
                data: "webm-writer-js"
              },
              {
                id: 22337,
                data: "webm-writer-js"
              },
              segmentDuration
            ]
          }, videoProperties = [
            {
              id: 176,
              data: videoWidth
            },
            {
              id: 186,
              data: videoHeight
            }
          ];
          if (options.transparent) {
            videoProperties.push({
              id: 21440,
              data: 1
            });
          }
          let tracks = {
            id: 374648427,
            data: [
              {
                id: 174,
                data: [
                  {
                    id: 215,
                    data: DEFAULT_TRACK_NUMBER
                  },
                  {
                    id: 29637,
                    data: DEFAULT_TRACK_NUMBER
                  },
                  {
                    id: 156,
                    data: 0
                  },
                  {
                    id: 2274716,
                    data: "und"
                  },
                  {
                    id: 134,
                    data: "V_VP8"
                  },
                  {
                    id: 2459272,
                    data: "VP8"
                  },
                  {
                    id: 131,
                    data: 1
                  },
                  {
                    id: 224,
                    data: videoProperties
                  }
                ]
              }
            ]
          };
          ebmlSegment = {
            id: 408125543,
            size: -1,
            data: [seekHead, segmentInfo, tracks]
          };
          let bufferStream = new ArrayBufferDataStream(256);
          writeEBML(bufferStream, blobBuffer.pos, [ebmlHeader, ebmlSegment]);
          blobBuffer.write(bufferStream.getAsDataArray());
          seekPoints.SegmentInfo.positionEBML.data = fileOffsetToSegmentRelative(segmentInfo.offset);
          seekPoints.Tracks.positionEBML.data = fileOffsetToSegmentRelative(tracks.offset);
          writtenHeader = true;
        }
        function createBlockGroupForTransparentKeyframe(keyframe) {
          let block, blockAdditions, bufferStream = new ArrayBufferDataStream(1 + 2 + 1);
          if (!(keyframe.trackNumber > 0 && keyframe.trackNumber < 127)) {
            throw new Error("TrackNumber must be > 0 and < 127");
          }
          bufferStream.writeEBMLVarInt(keyframe.trackNumber);
          bufferStream.writeU16BE(keyframe.timecode);
          bufferStream.writeByte(0);
          block = {
            id: 161,
            data: [bufferStream.getAsDataArray(), keyframe.frame]
          };
          blockAdditions = {
            id: 30113,
            data: [
              {
                id: 166,
                data: [
                  {
                    id: 238,
                    data: 1
                  },
                  {
                    id: 165,
                    data: keyframe.alpha
                  }
                ]
              }
            ]
          };
          return {
            id: 160,
            data: [block, blockAdditions]
          };
        }
        function createSimpleBlockForKeyframe(keyframe) {
          let bufferStream = new ArrayBufferDataStream(1 + 2 + 1);
          if (!(keyframe.trackNumber > 0 && keyframe.trackNumber < 127)) {
            throw new Error("TrackNumber must be > 0 and < 127");
          }
          bufferStream.writeEBMLVarInt(keyframe.trackNumber);
          bufferStream.writeU16BE(keyframe.timecode);
          bufferStream.writeByte(1 << 7);
          return {
            id: 163,
            data: [bufferStream.getAsDataArray(), keyframe.frame]
          };
        }
        function createContainerForKeyframe(keyframe) {
          if (keyframe.alpha) {
            return createBlockGroupForTransparentKeyframe(keyframe);
          }
          return createSimpleBlockForKeyframe(keyframe);
        }
        function createCluster(cluster) {
          return {
            id: 524531317,
            data: [
              {
                id: 231,
                data: Math.round(cluster.timecode)
              }
            ]
          };
        }
        function addCuePoint(trackIndex, clusterTime, clusterFileOffset) {
          cues.push({
            id: 187,
            data: [
              {
                id: 179,
                data: clusterTime
              },
              {
                id: 183,
                data: [
                  {
                    id: 247,
                    data: trackIndex
                  },
                  {
                    id: 241,
                    data: fileOffsetToSegmentRelative(clusterFileOffset)
                  }
                ]
              }
            ]
          });
        }
        function writeCues() {
          let ebml = {
            id: 475249515,
            data: cues
          }, cuesBuffer = new ArrayBufferDataStream(16 + cues.length * 32);
          writeEBML(cuesBuffer, blobBuffer.pos, ebml);
          blobBuffer.write(cuesBuffer.getAsDataArray());
          seekPoints.Cues.positionEBML.data = fileOffsetToSegmentRelative(ebml.offset);
        }
        function flushClusterFrameBuffer() {
          if (clusterFrameBuffer.length === 0) {
            return;
          }
          let rawImageSize = 0;
          for (let i = 0; i < clusterFrameBuffer.length; i++) {
            rawImageSize += clusterFrameBuffer[i].frame.length + (clusterFrameBuffer[i].alpha ? clusterFrameBuffer[i].alpha.length : 0);
          }
          let buffer = new ArrayBufferDataStream(rawImageSize + clusterFrameBuffer.length * 64), cluster = createCluster({
            timecode: Math.round(clusterStartTime)
          });
          for (let i = 0; i < clusterFrameBuffer.length; i++) {
            cluster.data.push(createContainerForKeyframe(clusterFrameBuffer[i]));
          }
          writeEBML(buffer, blobBuffer.pos, cluster);
          blobBuffer.write(buffer.getAsDataArray());
          addCuePoint(DEFAULT_TRACK_NUMBER, Math.round(clusterStartTime), cluster.offset);
          clusterFrameBuffer = [];
          clusterStartTime += clusterDuration;
          clusterDuration = 0;
        }
        function validateOptions() {
          if (!options.frameDuration) {
            if (options.frameRate) {
              options.frameDuration = 1e3 / options.frameRate;
            } else {
              throw new Error("Missing required frameDuration or frameRate setting");
            }
          }
          options.quality = Math.max(Math.min(options.quality, 0.99999), 0);
          if (options.alphaQuality === void 0) {
            options.alphaQuality = options.quality;
          } else {
            options.alphaQuality = Math.max(Math.min(options.alphaQuality, 0.99999), 0);
          }
        }
        function addFrameToCluster(frame) {
          frame.trackNumber = DEFAULT_TRACK_NUMBER;
          frame.timecode = Math.round(clusterDuration);
          clusterFrameBuffer.push(frame);
          clusterDuration += frame.duration;
          if (clusterDuration >= MAX_CLUSTER_DURATION_MSEC) {
            flushClusterFrameBuffer();
          }
        }
        function rewriteSeekHead() {
          let seekHeadBuffer = new ArrayBufferDataStream(seekHead.size), oldPos = blobBuffer.pos;
          writeEBML(seekHeadBuffer, seekHead.dataOffset, seekHead.data);
          blobBuffer.seek(seekHead.dataOffset);
          blobBuffer.write(seekHeadBuffer.getAsDataArray());
          blobBuffer.seek(oldPos);
        }
        function rewriteDuration() {
          let buffer = new ArrayBufferDataStream(8), oldPos = blobBuffer.pos;
          buffer.writeDoubleBE(clusterStartTime);
          blobBuffer.seek(segmentDuration.dataOffset);
          blobBuffer.write(buffer.getAsDataArray());
          blobBuffer.seek(oldPos);
        }
        this.addFrame = function(frame, alpha, overrideFrameDuration) {
          if (!writtenHeader) {
            videoWidth = frame.width || 0;
            videoHeight = frame.height || 0;
            writeHeader();
          }
          let keyframe = extractKeyframeFromWebP(renderAsWebP(frame, options.quality)), frameDuration, frameAlpha = null;
          if (overrideFrameDuration) {
            frameDuration = overrideFrameDuration;
          } else if (typeof alpha == "number") {
            frameDuration = alpha;
          } else {
            frameDuration = options.frameDuration;
          }
          if (options.transparent) {
            if (alpha instanceof HTMLCanvasElement || typeof alpha === "string") {
              frameAlpha = alpha;
            } else if (keyframe.hasAlpha) {
              frameAlpha = convertAlphaToGrayscaleImage(frame);
            }
          }
          addFrameToCluster({
            frame: keyframe.frame,
            duration: frameDuration,
            alpha: frameAlpha ? extractKeyframeFromWebP(renderAsWebP(frameAlpha, options.alphaQuality)).frame : null
          });
        };
        this.complete = function() {
          console.log("webm-writer complete!", blobBuffer.length);
          if (!writtenHeader) {
            writeHeader();
          }
          flushClusterFrameBuffer();
          writeCues();
          rewriteSeekHead();
          rewriteDuration();
          return blobBuffer.complete("video/webm");
        };
        this.getWrittenSize = function() {
          return blobBuffer.length;
        };
        options = extend(optionDefaults, options || {});
        validateOptions();
      };
    };
    window.WebMWriter = WebMWriter(window.ArrayBufferDataStream, window.BlobBuffer);
  })();

  // src/vendor/download.js
  (function() {
    window.download = function(data, strFileName, strMimeType) {
      var self = window, defaultMime = "application/octet-stream", mimeType = strMimeType || defaultMime, payload = data, url = !strFileName && !strMimeType && payload, anchor = document.createElement("a"), toString = function(a) {
        return String(a);
      }, myBlob = self.Blob || self.MozBlob || self.WebKitBlob || toString, fileName = strFileName || "download", blob, reader;
      myBlob = myBlob.call ? myBlob.bind(self) : Blob;
      if (String(this) === "true") {
        payload = [payload, mimeType];
        mimeType = payload[0];
        payload = payload[1];
      }
      if (url && url.length < 2048) {
        fileName = url.split("/").pop().split("?")[0];
        anchor.href = url;
        if (anchor.href.indexOf(url) !== -1) {
          var ajax = new XMLHttpRequest();
          ajax.open("GET", url, true);
          ajax.responseType = "blob";
          ajax.onload = function(e) {
            download(e.target.response, fileName, defaultMime);
          };
          setTimeout(function() {
            ajax.send();
          }, 0);
          return ajax;
        }
      }
      if (/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)) {
        if (payload.length > 1024 * 1024 * 1.999 && myBlob !== toString) {
          payload = dataUrlToBlob(payload);
          mimeType = payload.type || defaultMime;
        } else {
          return navigator.msSaveBlob ? navigator.msSaveBlob(dataUrlToBlob(payload), fileName) : saver(payload);
        }
      } else {
        if (/([\x80-\xff])/.test(payload)) {
          var i = 0, tempUiArr = new Uint8Array(payload.length), mx = tempUiArr.length;
          for (i; i < mx; ++i)
            tempUiArr[i] = payload.charCodeAt(i);
          payload = new myBlob([tempUiArr], { type: mimeType });
        }
      }
      blob = payload instanceof myBlob ? payload : new myBlob([payload], { type: mimeType });
      function dataUrlToBlob(strUrl) {
        var parts = strUrl.split(/[:;,]/), type = parts[1], indexDecoder = strUrl.indexOf("charset") > 0 ? 3 : 2, decoder = parts[indexDecoder] == "base64" ? atob : decodeURIComponent, binData = decoder(parts.pop()), mx2 = binData.length, i2 = 0, uiArr = new Uint8Array(mx2);
        for (i2; i2 < mx2; ++i2)
          uiArr[i2] = binData.charCodeAt(i2);
        return new myBlob([uiArr], { type });
      }
      function saver(url2, winMode) {
        if ("download" in anchor) {
          anchor.href = url2;
          anchor.setAttribute("download", fileName);
          anchor.className = "download-js-link";
          anchor.innerHTML = "downloading...";
          anchor.style.display = "none";
          anchor.addEventListener("click", function(e) {
            e.stopPropagation();
            this.removeEventListener("click", arguments.callee);
          });
          document.body.appendChild(anchor);
          setTimeout(function() {
            anchor.click();
            document.body.removeChild(anchor);
            if (winMode === true) {
              setTimeout(function() {
                self.URL.revokeObjectURL(anchor.href);
              }, 250);
            }
          }, 66);
          return true;
        }
        if (/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
          if (/^data:/.test(url2))
            url2 = "data:" + url2.replace(/^data:([\w\/\-\+]+)/, defaultMime);
          if (!window.open(url2)) {
            if (confirm("Displaying New Document. Use Save As... to download, then click back to return to this page.")) {
              location.href = url2;
            }
          }
          return true;
        }
        var f = document.createElement("iframe");
        document.body.appendChild(f);
        if (!winMode && /^data:/.test(url2)) {
          url2 = "data:" + url2.replace(/^data:([\w\/\-\+]+)/, defaultMime);
        }
        f.src = url2;
        setTimeout(function() {
          document.body.removeChild(f);
        }, 333);
      }
      if (navigator.msSaveBlob) {
        return navigator.msSaveBlob(blob, fileName);
      }
      if (self.URL) {
        saver(self.URL.createObjectURL(blob), true);
      } else {
        if (typeof blob === "string" || blob.constructor === toString) {
          try {
            return saver("data:" + mimeType + ";base64," + self.btoa(blob));
          } catch (y) {
            return saver("data:" + mimeType + "," + encodeURIComponent(blob));
          }
        }
        reader = new FileReader();
        reader.onload = function(e) {
          saver(this.result);
        };
        reader.readAsDataURL(blob);
      }
      return true;
    };
  })();

  // src/vendor/ccapture.js
  (function() {
    "use strict";
    var Tar = window.Tar;
    var download2 = window.download;
    var GIF = window.GIF;
    var WebMWriter = window.WebMWriter;
    if (!("gc" in window)) {
      window.gc = function() {
      };
    }
    if (!HTMLCanvasElement.prototype.toBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        value: function(callback, type, quality) {
          var binStr = atob(this.toDataURL(type, quality).split(",")[1]), len = binStr.length, arr = new Uint8Array(len);
          for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
          }
          callback(new Blob([arr], { type: type || "image/png" }));
        }
      });
    }
    (function() {
      if ("performance" in window == false) {
        window.performance = {};
      }
      if ("now" in window.performance == false) {
        var nowOffset = Date.now();
        window.performance.now = function now() {
          return Date.now() - nowOffset;
        };
      }
    })();
    function pad(n) {
      return String("0000000" + n).slice(-7);
    }
    var g_startTime = window.Date.now();
    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
      }
      return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    }
    function CCFrameEncoder(settings) {
      var _handlers = {};
      this.settings = settings;
      this.on = function(event, handler) {
        _handlers[event] = handler;
      };
      this.emit = function(event) {
        var handler = _handlers[event];
        if (handler) {
          handler.apply(null, Array.prototype.slice.call(arguments, 1));
        }
      };
      this.filename = settings.name || guid();
      this.extension = "";
      this.mimeType = "";
    }
    CCFrameEncoder.prototype.start = function() {
    };
    CCFrameEncoder.prototype.stop = function() {
    };
    CCFrameEncoder.prototype.add = function() {
    };
    CCFrameEncoder.prototype.save = function() {
    };
    CCFrameEncoder.prototype.dispose = function() {
    };
    CCFrameEncoder.prototype.safeToProceed = function() {
      return true;
    };
    CCFrameEncoder.prototype.step = function() {
      console.log("Step not set!");
    };
    function CCWebMEncoder(settings) {
      var canvas = document.createElement("canvas");
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
        frameRate: this.framerate
      });
    }
    CCWebMEncoder.prototype = Object.create(CCFrameEncoder.prototype);
    CCWebMEncoder.prototype.start = function(canvas) {
      this.dispose();
    };
    CCWebMEncoder.prototype.add = function(canvas) {
      this.videoWriter.addFrame(canvas);
      if (this.settings.autoSaveTime > 0 && this.frames / this.settings.framerate >= this.settings.autoSaveTime) {
        this.save(function(blob) {
          this.filename = this.baseFilename + "-part-" + pad(this.part);
          download2(blob, this.filename + this.extension, this.mimeType);
          this.dispose();
          this.part++;
          this.filename = this.baseFilename + "-part-" + pad(this.part);
          this.step();
        }.bind(this));
      } else {
        this.frames++;
        this.step();
      }
    };
    CCWebMEncoder.prototype.save = function(callback) {
      this.videoWriter.complete().then(callback);
    };
    CCWebMEncoder.prototype.dispose = function(canvas) {
      this.frames = 0;
      this.videoWriter = new WebMWriter({
        quality: this.quality,
        fileWriter: null,
        fd: null,
        frameRate: this.framerate
      });
    };
    function CCFFMpegServerEncoder(settings) {
      CCFrameEncoder.call(this, settings);
      settings.quality = settings.quality / 100 || 0.8;
      this.encoder = new FFMpegServer.Video(settings);
      this.encoder.on("process", function() {
        this.emit("process");
      }.bind(this));
      this.encoder.on("finished", function(url, size) {
        var cb = this.callback;
        if (cb) {
          this.callback = void 0;
          cb(url, size);
        }
      }.bind(this));
      this.encoder.on("progress", function(progress) {
        if (this.settings.onProgress) {
          this.settings.onProgress(progress);
        }
      }.bind(this));
      this.encoder.on("error", function(data) {
        alert(JSON.stringify(data, null, 2));
      }.bind(this));
    }
    CCFFMpegServerEncoder.prototype = Object.create(CCFrameEncoder.prototype);
    CCFFMpegServerEncoder.prototype.start = function() {
      this.encoder.start(this.settings);
    };
    CCFFMpegServerEncoder.prototype.add = function(canvas) {
      this.encoder.add(canvas);
    };
    CCFFMpegServerEncoder.prototype.save = function(callback) {
      this.callback = callback;
      this.encoder.end();
    };
    CCFFMpegServerEncoder.prototype.safeToProceed = function() {
      return this.encoder.safeToProceed();
    };
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
    CCStreamEncoder.prototype.add = function(canvas) {
      if (!this.stream) {
        this.stream = canvas.captureStream(this.framerate);
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.mediaRecorder.start();
        this.mediaRecorder.ondataavailable = function(e) {
          this.chunks.push(e.data);
        }.bind(this);
      }
      this.step();
    };
    CCStreamEncoder.prototype.save = function(callback) {
      this.mediaRecorder.onstop = function(e) {
        var blob = new Blob(this.chunks, { "type": "video/webm" });
        this.chunks = [];
        callback(blob);
      }.bind(this);
      this.mediaRecorder.stop();
    };
    function CCGIFEncoder(settings) {
      CCFrameEncoder.call(this, settings);
      settings.quality = 31 - (settings.quality * 30 / 100 || 10);
      settings.workers = settings.workers || 4;
      this.extension = ".gif";
      this.mimeType = "image/gif";
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.sizeSet = false;
      this.encoder = new GIF({
        workers: settings.workers,
        quality: settings.quality,
        workerScript: settings.workersPath + "gif.worker.js"
      });
      this.encoder.on("progress", function(progress) {
        if (this.settings.onProgress) {
          this.settings.onProgress(progress);
        }
      }.bind(this));
      this.encoder.on("finished", function(blob) {
        var cb = this.callback;
        if (cb) {
          this.callback = void 0;
          cb(blob);
        }
      }.bind(this));
    }
    CCGIFEncoder.prototype = Object.create(CCFrameEncoder.prototype);
    CCGIFEncoder.prototype.add = function(canvas) {
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
    };
    CCGIFEncoder.prototype.save = function(callback) {
      this.callback = callback;
      this.encoder.render();
    };
    function CCapture(settings) {
      var _settings = settings || {}, _date = new Date(), _verbose, _display, _time, _startTime, _performanceTime, _performanceStartTime, _step, _encoder, _timeouts = [], _intervals = [], _frameCount = 0, _intermediateFrameCount = 0, _lastFrame = null, _requestAnimationFrameCallbacks = [], _capturing = false, _handlers = {};
      _settings.framerate = _settings.framerate || 60;
      _settings.motionBlurFrames = 2 * (_settings.motionBlurFrames || 1);
      _verbose = _settings.verbose || false;
      _display = _settings.display || false;
      _settings.step = 1e3 / _settings.framerate;
      _settings.timeLimit = _settings.timeLimit || 0;
      _settings.frameLimit = _settings.frameLimit || 0;
      _settings.startTime = _settings.startTime || 0;
      var _timeDisplay = document.createElement("div");
      _timeDisplay.style.position = "absolute";
      _timeDisplay.style.left = _timeDisplay.style.top = 0;
      _timeDisplay.style.backgroundColor = "black";
      _timeDisplay.style.fontFamily = "monospace";
      _timeDisplay.style.fontSize = "11px";
      _timeDisplay.style.padding = "5px";
      _timeDisplay.style.color = "red";
      _timeDisplay.style.zIndex = 1e5;
      if (_settings.display)
        document.body.appendChild(_timeDisplay);
      var canvasMotionBlur = document.createElement("canvas");
      var ctxMotionBlur = canvasMotionBlur.getContext("2d");
      var bufferMotionBlur;
      var imageData;
      _log("Step is set to " + _settings.step + "ms");
      var _encoders = {
        webm: CCWebMEncoder,
        "webm-mediarecorder": CCStreamEncoder
      };
      var ctor = _encoders[_settings.format];
      if (!ctor) {
        throw "Error: Incorrect or missing format: Valid formats are " + Object.keys(_encoders).join(", ");
      }
      _encoder = new ctor(_settings);
      _encoder.step = _step;
      _encoder.on("process", _process);
      _encoder.on("progress", _progress);
      if ("performance" in window == false) {
        window.performance = {};
      }
      Date.now = Date.now || function() {
        return new Date().getTime();
      };
      if ("now" in window.performance == false) {
        var nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart) {
          nowOffset = performance.timing.navigationStart;
        }
        window.performance.now = function now() {
          return Date.now() - nowOffset;
        };
      }
      var _oldSetTimeout = window.setTimeout, _oldSetInterval = window.setInterval, _oldClearInterval = window.clearInterval, _oldClearTimeout = window.clearTimeout, _oldRequestAnimationFrame = window.requestAnimationFrame, _oldNow = window.Date.now, _oldPerformanceNow = window.performance.now, _oldGetTime = window.Date.prototype.getTime;
      var media = [];
      function _init() {
        _log("Capturer start");
        _startTime = window.Date.now();
        _time = _startTime + _settings.startTime;
        _performanceStartTime = window.performance.now();
        _performanceTime = _performanceStartTime + _settings.startTime;
        window.Date.prototype.getTime = function() {
          return _time;
        };
        window.Date.now = function() {
          return _time;
        };
        window.setTimeout = function(callback, time) {
          var t = {
            callback,
            time,
            triggerTime: _time + time
          };
          _timeouts.push(t);
          _log("Timeout set to " + t.time);
          return t;
        };
        window.clearTimeout = function(id) {
          for (var j = 0; j < _timeouts.length; j++) {
            if (_timeouts[j] == id) {
              _timeouts.splice(j, 1);
              _log("Timeout cleared");
              continue;
            }
          }
        };
        window.setInterval = function(callback, time) {
          var t = {
            callback,
            time,
            triggerTime: _time + time
          };
          _intervals.push(t);
          _log("Interval set to " + t.time);
          return t;
        };
        window.clearInterval = function(id) {
          _log("clear Interval");
          return null;
        };
        window.requestAnimationFrame = function(callback) {
          _requestAnimationFrameCallbacks.push(callback);
        };
        window.performance.now = function() {
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
        ;
        try {
          Object.defineProperty(HTMLVideoElement.prototype, "currentTime", { get: hookCurrentTime });
          Object.defineProperty(HTMLAudioElement.prototype, "currentTime", { get: hookCurrentTime });
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
        var seconds = _frameCount / _settings.framerate;
        if (_settings.frameLimit && _frameCount >= _settings.frameLimit || _settings.timeLimit && seconds >= _settings.timeLimit) {
          _stop();
          _save();
        }
        var d = new Date(null);
        d.setSeconds(seconds);
        if (_settings.motionBlurFrames > 2) {
          _timeDisplay.textContent = "CCapture " + _settings.format + " | " + _frameCount + " frames (" + _intermediateFrameCount + " inter) | " + d.toISOString().substr(11, 8);
        } else {
          _timeDisplay.textContent = "CCapture " + _settings.format + " | " + _frameCount + " frames | " + d.toISOString().substr(11, 8);
        }
      }
      function _checkFrame(canvas) {
        if (canvasMotionBlur.width !== canvas.width || canvasMotionBlur.height !== canvas.height) {
          canvasMotionBlur.width = canvas.width;
          canvasMotionBlur.height = canvas.height;
          bufferMotionBlur = new Uint16Array(canvasMotionBlur.height * canvasMotionBlur.width * 4);
          ctxMotionBlur.fillStyle = "#0";
          ctxMotionBlur.fillRect(0, 0, canvasMotionBlur.width, canvasMotionBlur.height);
        }
      }
      function _blendFrame(canvas) {
        ctxMotionBlur.drawImage(canvas, 0, 0);
        imageData = ctxMotionBlur.getImageData(0, 0, canvasMotionBlur.width, canvasMotionBlur.height);
        for (var j = 0; j < bufferMotionBlur.length; j += 4) {
          bufferMotionBlur[j] += imageData.data[j];
          bufferMotionBlur[j + 1] += imageData.data[j + 1];
          bufferMotionBlur[j + 2] += imageData.data[j + 2];
        }
        _intermediateFrameCount++;
      }
      function _saveFrame() {
        var data = imageData.data;
        for (var j = 0; j < bufferMotionBlur.length; j += 4) {
          data[j] = bufferMotionBlur[j] * 2 / _settings.motionBlurFrames;
          data[j + 1] = bufferMotionBlur[j + 1] * 2 / _settings.motionBlurFrames;
          data[j + 2] = bufferMotionBlur[j + 2] * 2 / _settings.motionBlurFrames;
        }
        ctxMotionBlur.putImageData(imageData, 0, 0);
        _encoder.add(canvasMotionBlur);
        _frameCount++;
        _intermediateFrameCount = 0;
        _log("Full MB Frame! " + _frameCount + " " + _time);
        for (var j = 0; j < bufferMotionBlur.length; j += 4) {
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
        var step = 1e3 / _settings.framerate;
        var dt = (_frameCount + _intermediateFrameCount / _settings.motionBlurFrames) * step;
        _time = _startTime + dt;
        _performanceTime = _performanceStartTime + dt;
        media.forEach(function(v) {
          v._hookedTime = dt / 1e3;
        });
        _updateTime();
        _log("Frame: " + _frameCount + " " + _intermediateFrameCount);
        for (var j = 0; j < _timeouts.length; j++) {
          if (_time >= _timeouts[j].triggerTime) {
            _call(_timeouts[j].callback);
            _timeouts.splice(j, 1);
            continue;
          }
        }
        for (var j = 0; j < _intervals.length; j++) {
          if (_time >= _intervals[j].triggerTime) {
            _call(_intervals[j].callback);
            _intervals[j].triggerTime += _intervals[j].time;
            continue;
          }
        }
        _requestAnimationFrameCallbacks.forEach(function(cb) {
          _call(cb, _time - g_startTime);
        });
        _requestAnimationFrameCallbacks = [];
      }
      function _save(callback) {
        if (!callback) {
          callback = function(blob) {
            download2(blob, _encoder.filename + _encoder.extension, _encoder.mimeType);
            return false;
          };
        }
        _encoder.save(callback);
      }
      function _log(message) {
        if (_verbose)
          console.log(message);
      }
      function _on(event, handler) {
        _handlers[event] = handler;
      }
      function _emit(event) {
        var handler = _handlers[event];
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
        on: _on
      };
    }
    window.CCapture = CCapture;
  })();

  // src/capturer.ts
  var Capturer = class {
    constructor() {
      this.active = false;
      this.running = false;
    }
    enableCapture({ frameCount, element, onComplete }) {
      this.active = true;
      this.el = element;
      this.maxFrames = frameCount;
      this.frames = 0;
      this.capture = new window.CCapture({
        framerate: 60,
        format: "webm",
        verbose: false
      });
      this.onComplete = onComplete || function() {
      };
    }
    captureFrame() {
      if (this.active && !this.running) {
        this.capture.start();
      }
      if (this.active) {
        this.capture.capture(this.el);
        this.frames++;
        if (this.frames > this.maxFrames) {
          this.capture.stop();
          this.capture.save();
          this.onComplete();
        }
      }
    }
  };

  // src/index.ts
  if (window) {
    const capturer = new Capturer();
    window.enableCapture = capturer.enableCapture.bind(capturer);
    window.captureFrame = capturer.captureFrame.bind(capturer);
  }
})();
// @license http://opensource.org/licenses/MIT
//# sourceMappingURL=p5.webm-capture.js.map
