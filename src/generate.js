const fs = require('fs');
const path = require('path');

// This stream will take only one part of file.
const readStream = fs.createReadStream(path.join(__dirname, '../assets/test.csv'), {
  highWaterMark: 64 * 1024, // chunk size
  start: 0,
  end: 64 * 1024 - 1,
});
const writeStream = fs.createWriteStream(path.join(__dirname, '../assets/big-test.csv'));

const repeatedWriteChunk = (data, repeatCount) => {
  const isWritten = writeStream.write(data);

  if (repeatCount < 0) return writeStream.end();

  if (isWritten) {
    return repeatedWriteChunk(data, repeatCount - 1);
  } else {
    // https://nodejs.org/api/stream.html#stream_event_drain
    writeStream.once('drain', () => repeatedWriteChunk(data, repeatCount - 1));
  }
};

readStream.on('data', chunk => {
  console.log('Big csv file is generating...');
  let lines = chunk
    .toString('utf8')
    .trim()
    .split('\r\n');

  const fieldNamesLine = lines.shift();
  writeStream.write(`${fieldNamesLine}\r\n`);

  // Last line can be part of the next chunk first line, so remove it.
  lastLine = lines.pop();

  const partialData = lines.join('\r\n');

  repeatedWriteChunk(partialData, 170000);
});

readStream.on('error', console.log);
writeStream.on('error', console.log).on('finish', () => {
  console.log('Big csv file has generated.');
});
