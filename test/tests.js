'use strict';
const assert = require('assert');
const stream = require('stream');
const KclReadableStream = require('../index');

const mockKcl = function (kclProcessor) {
  return {
    initialize: function(input) {
      kclProcessor.initialize(input, function() {});
    },
    shutdown: function(input) {
      kclProcessor.shutdown(input, function() {});
    },
    processRecords: function(input) {
      kclProcessor.processRecords(input, function() {});
    }
  };
};

describe ('KCL object specification', function () {
  it ('should have all expected methods', function () {
    const kclProcessor = new KclReadableStream();
    assert.ok(kclProcessor.initialize);
    assert.ok(kclProcessor.shutdown);
    assert.ok(kclProcessor.processRecords);
    assert.equal(kclProcessor.whateverThisDoesntExist, undefined);
  });

  it ('should call custom initialize method', function () {
    const kclProcessor = new KclReadableStream({
      kcl: {
        initialize: function (input) {
          assert.equal(input, 'input from initialize');
        }
      }
    });
    mockKcl(kclProcessor).initialize('input from initialize');
  });

  it ('should call custom shutdown method', function () {
    const kclProcessor = new KclReadableStream({
      kcl: {
        shutdown: function (input) {
          assert.equal(input, 'input from shutdown');
        }
      }
    });
    mockKcl(kclProcessor).shutdown('input from shutdown');
  });

  it ('should call processRecords', function () {
    let originalProcessRecords = KclReadableStream.prototype.processRecords;
    const kclProcessor = new KclReadableStream();
    KclReadableStream.prototype.processRecords = function (data) {
      let records = data.records;
      assert.equal(typeof records, 'object');
      assert.equal(records.length, 2);
      assert.equal(records[0], 'A');
      assert.equal(records[1], 'B');
      KclReadableStream.prototype.processRecords = originalProcessRecords;
    };
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B'] });
  });
});

describe ('.on("data")', function () {
  it ('should work with streamSingleRecords === true', function (done) {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: true } });
    let count = 0;
    kclProcessor.on('data', function (data) {
      assert.equal(typeof data, 'string');
      assert.ok(['A', 'B', 'C'].indexOf(data) !== -1);
      count++;
      if (count === 3) {
        done();
      }
    });
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] });
  });

  it ('should work with streamSingleRecords === false', function (done) {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: false } });
    kclProcessor.on('data', function (data) {
      assert.equal(typeof data, 'object');
      assert.equal(data.length, 3);
      assert.equal(data[0], 'A');
      assert.equal(data[1], 'B');
      assert.equal(data[2], 'C');
      done();
    });
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] }, function() {});
  });
});

describe ('.pipe', function () {
  it ('should work with streamSingleRecords === true', function (done) {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: true } });
    let count = 0;
    var writableStream = new stream.Writable({
      objectMode: true,
      write: function(data, encoding, next) {
        assert.equal(typeof data, 'string');
        assert.ok(['A', 'B', 'C'].indexOf(data) !== -1);
        count++;
        if (count === 3) {
          done();
        } else {
          next();
        }
      }
    });
    kclProcessor.pipe(writableStream);
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] });
  });

  it ('should work with streamSingleRecords === false', function (done) {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: false } });
    var writableStream = new stream.Writable({
      objectMode: true,
      write: function(data) {
        assert.equal(typeof data, 'object');
        assert.equal(data.length, 3);
        assert.equal(data[0], 'A');
        assert.equal(data[1], 'B');
        assert.equal(data[2], 'C');
        done();
      }
    });
    kclProcessor.pipe(writableStream);
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] }, function() {});
  });
});
