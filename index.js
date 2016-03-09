'use strict';

const Readable = require('stream').Readable;
const util = require('util');

function KclReadableStream(options) {
  if (!(this instanceof KclReadableStream)) {
    return new KclReadableStream(options);
  }
  if (!options) {
    options = {};
  }

  // default KCL options
  this.initialize = (input, callback) => { callback(); };
  this.shutdown = (input, callback) => { callback(); };
  this.streamSingleRecords = false;

  if (options.kcl) {
    if (options.kcl.initialize && typeof options.kcl.initialize === 'function') {
      this.initialize = options.kcl.initialize;
    }
    if (options.kcl.shutdown && typeof options.kcl.shutdown === 'function') {
      this.shutdown = options.kcl.shutdown;
    }
    if (options.kcl.streamSingleRecords) {
      this.streamSingleRecords = options.kcl.streamSingleRecords;
    }
    delete options.kcl;
  }

  // ReadableStream options
  options.objectMode = true;
  Readable.call(this, options);
}

util.inherits(KclReadableStream, Readable);

KclReadableStream.prototype._read = () => {};

KclReadableStream.prototype.processRecords = function (data, callback) {
  if (!data || !data.records) {
    return callback();
  }
  if (this.streamSingleRecords) {
    for (let i = 0; i < data.records.length; i++) {
      this.push(data.records[i]);
    }
  } else {
    this.push(data.records);
  }
  callback();
};

module.exports = KclReadableStream;
