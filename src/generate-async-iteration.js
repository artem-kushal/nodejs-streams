const fs = require('fs');
const path = require('path');
const { once } = require('events');
const util = require('util');
const stream = require('stream');

const finished = util.promisify(stream.finished); // (A)

// This stream will take only one part of file.
const readStream = fs.createReadStream(path.join(__dirname, '../assets/test.csv'), {
  highWaterMark: 64 * 1024, // chunk size
  start: 0,
  end: 64 * 1024 - 1,
});
const writeStream = fs.createWriteStream(path.join(__dirname, '../assets/big-test.csv'));

const repeatedWriteChunk = async (data, repeatCount) => {
  for (let i = 0; i < repeatCount; i++) {
    if (!writeStream.write(data)) {
      // https://nodejs.org/api/stream.html#stream_event_drain
      await once(writeStream, 'drain');
    }
  }

  writeStream.end();

  await finished(writeStream);
};

const writeChunk = async chunk => {
  let lines = chunk
    .toString('utf8')
    .trim()
    .split('\r\n');

  const fieldNamesLine = lines.shift();
  writeStream.write(`${fieldNamesLine}\r\n`);

  // Last line can be part of the next chunk first line, so remove it.
  lastLine = lines.pop();

  const partialData = lines.join('\r\n');

  await repeatedWriteChunk(partialData, 170000);
};

const runGenerating = async readable => {
  try {
    console.log('Big csv file is generating...');

    for await (const chunk of readable) {
      await writeChunk(chunk);
    }

    console.log('Big csv file has generated.');
  } catch (err) {
    console.log(err);
  }
};

runGenerating(readStream);
