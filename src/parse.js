const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');

const pipeline = util.promisify(stream.pipeline);

const BIG_FILE_FLAG = '--useBigFile';
const isUseBigFile = process.argv.includes(BIG_FILE_FLAG);
const fileName = isUseBigFile ? 'big-test' : 'test';

let fieldNames = null;

const convertToObject = data =>
  fieldNames.reduce((res, fieldName, index) => ({ ...res, [fieldName]: data[index].trim() }), {});

const convertChunkToJSON = (() => {
  let isFirstChunk = true;
  let lastLine = '';

  return chunk => {
    // This condition is for adding array bracket.
    const initialStartResString = isFirstChunk ? '[\n' : '';
    const chunkString = chunk.toString('utf8').trim();
    const lines = `${lastLine}${chunkString}`.split('\r\n');

    if (isFirstChunk) {
      fieldNames = lines
        .shift()
        .trim()
        .split(',');
    }

    // Last line can be part of the next chunk first line,
    // so we need to cut and add this line to the start of next chunk.
    lastLine = lines.pop();

    const data = lines.map(line => convertToObject(line.trim().split(',')));
    const formattedData = data.map(item => `,\n\t${JSON.stringify(item)}`);

    // This condition is for ignoring comma before first item.
    if (isFirstChunk) {
      isFirstChunk = false;

      formattedData[0] = `\t${JSON.stringify(data[0])}`;
    }

    return `${initialStartResString}${formattedData.join('')}`;
  };
})();

const transformToJSON = new stream.Transform({
  transform(chunk, encoding, callback) {
    try {
      const resultString = convertChunkToJSON(chunk);

      callback(null, resultString);
    } catch (err) {
      callback(err);
    }
  },
  flush(callback) {
    // This condition is for closing array bracket.
    callback(null, '\n]');
  },
});

const readStream = fs.createReadStream(path.join(__dirname, `../assets/${fileName}.csv`));
const writeStream = fs.createWriteStream(path.join(__dirname, `../assets/${fileName}.json`));

const errorHandler = err => console.error(err);
const successHandler = () => console.log('File converted from csv to json.');

console.log('Csv file is converting to JSON...');
// --------------------------------------------------------------------
// We can handle errors for each stream or use pipeline for this reason.
// --------------------------------------------------------------------

// readStream
//   .on('error', errorHandler)
//   .pipe(transformToJSON)
//   .on('error', errorHandler)
//   .pipe(writeStream)
//   .on('error', errorHandler)
//   .on('finish', successHandler);

async function convertFronCsvToJson() {
  try {
    await pipeline(readStream, transformToJSON, writeStream);

    successHandler();
  } catch (err) {
    errorHandler(err);
  }
}

convertFronCsvToJson();
