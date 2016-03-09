# kcl-readable-stream

This project convert a [KCL](https://github.com/awslabs/amazon-kinesis-client-nodejs) object into a readable stream.

There are three (optional) options that can be used in the constructor:

* `kcl.initialize`: Will be called with `data` and `callback` when the KCL subprocess is initialized. The callback function must be called.
* `kcl.shutdown`: Will be called with `data` and `callback` when the KCL subprocess is shut down because of an error or if the process is stopped. The callback function must be called.
* `kcl.streamSingleRecords`: If `true`, `data` events will be emitted with single records; otherwise, an array of records will be used. Defaults to `false`.

## Example usage

```js
// run this with something like:
// `kcl-bootstrap --java /usr/bin/java -e -p ./conf/kinesis.properties`

const kcl = require('aws-kcl');
const KclReadableStream = require('kcl-readable-stream');

const kclProcessor = new KclReadableStream({
  kcl: {
    initialize: function (data, callback) {
      console.log('Initialized!');
      callback();
    },
    shutdown: function (data, callback) {
      console.log('Shutdown!');
      callback();
    },
    streamSingleRecords: false
  }
});

// if !streamSingleRecords
kclProcessor.on('data', function (records) {
  console.log('This is an array of records: ', records);
});

// if streamSingleRecords === true
kclProcessor.on('data', function (record) {
  console.log('This is a single record: ', record);
});

// you can also .pipe()
kclProcessor.pipe(process.stdout);

kcl(kclProcessor).run();
```
