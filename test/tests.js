'use strict';
const assert = require('assert');
const stream = require('stream');
const KclReadableStream = require('../index');

const mockKcl = (kclProcessor) => {
  return {
    initialize: (input) => {
      kclProcessor.initialize(input, () => {});
    },
    shutdown: (input) => {
      kclProcessor.shutdown(input, () => {});
    },
    processRecords: (input) => {
      kclProcessor.processRecords(input, () => {});
    }
  };
};

describe ('KCL object specification', () => {
  it ('should have all expected methods', () => {
    const kclProcessor = new KclReadableStream();
    assert.ok(kclProcessor.initialize);
    assert.ok(kclProcessor.shutdown);
    assert.ok(kclProcessor.processRecords);
    assert.equal(kclProcessor.whateverThisDoesntExist, undefined);
  });

  it ('should call custom initialize method', () => {
    const kclProcessor = new KclReadableStream({
      kcl: {
        initialize: (input) => {
          assert.equal(input, 'input from initialize');
        }
      }
    });
    mockKcl(kclProcessor).initialize('input from initialize');
  });

  it ('should call custom shutdown method', () => {
    const kclProcessor = new KclReadableStream({
      kcl: {
        shutdown: (input) => {
          assert.equal(input, 'input from shutdown');
        }
      }
    });
    mockKcl(kclProcessor).shutdown('input from shutdown');
  });

  it ('should call processRecords', () => {
    const originalProcessRecords = KclReadableStream.prototype.processRecords;
    const kclProcessor = new KclReadableStream();
    KclReadableStream.prototype.processRecords = (data) => {
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

describe ('.on("data")', () => {
  it ('should work with streamSingleRecords === true', (done) => {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: true } });
    let count = 0;
    kclProcessor.on('data', (data) => {
      assert.equal(typeof data, 'string');
      assert.ok(['A', 'B', 'C'].indexOf(data) !== -1);
      count++;
      if (count === 3) {
        done();
      }
    });
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] });
  });

  it ('should work with streamSingleRecords === false', (done) => {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: false } });
    kclProcessor.on('data', (data) => {
      assert.equal(typeof data, 'object');
      assert.equal(data.length, 3);
      assert.equal(data[0], 'A');
      assert.equal(data[1], 'B');
      assert.equal(data[2], 'C');
      done();
    });
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] }, () => {});
  });
});

describe ('.pipe', () => {
  it ('should work with streamSingleRecords === true', (done) => {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: true } });
    let count = 0;
    const writableStream = new stream.Writable({
      objectMode: true,
      write: (data, encoding, next) => {
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

  it ('should work with streamSingleRecords === false', (done) => {
    const kclProcessor = new KclReadableStream({ kcl: { streamSingleRecords: false } });
    const writableStream = new stream.Writable({
      objectMode: true,
      write: (data) => {
        assert.equal(typeof data, 'object');
        assert.equal(data.length, 3);
        assert.equal(data[0], 'A');
        assert.equal(data[1], 'B');
        assert.equal(data[2], 'C');
        done();
      }
    });
    kclProcessor.pipe(writableStream);
    mockKcl(kclProcessor).processRecords({ records: ['A', 'B', 'C'] }, () => {});
  });
});
