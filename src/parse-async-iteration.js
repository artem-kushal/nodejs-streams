const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');

const pipeline = util.promisify(stream.pipeline);

const BIG_FILE_FLAG = '--useBigFile';
const isUseBigFile = process.argv.includes(BIG_FILE_FLAG);
const fileName = isUseBigFile ? 'big-test' : 'test';

let fieldNames = null;

const convertToObject = data => {
  return fieldNames.reduce((res, fieldName, index) => {
    return { ...res, [fieldName]: data[index].trim() };
  }, {});
};

const convertChunkToJSON = (() => {
  let isFirstChunk = true;
  let lastLine = '';

  return chunk => {
    // This condition is for adding array bracket.
    const initialStartResString = isFirstChunk ? '[\n' : '';
    let chunkString = chunk.toString('utf8').trim();
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

async function* transformToJSON(readable) {
  for await (const chunk of readable) {
    const resultString = convertChunkToJSON(chunk);

    yield resultString;
  }

  yield '\n]';
}

const readStream = fs.createReadStream(path.join(__dirname, `../assets/${fileName}.csv`));
const writeStream = fs.createWriteStream(path.join(__dirname, `../assets/${fileName}.json`));

const errorHandler = err => console.error(err);
const successHandler = () => console.log('File converted from csv to json.');

async function convertFronCsvToJson() {
  try {
    console.log('Csv file is converting to JSON...');

    const transformedReadStream = stream.Readable.from(transformToJSON(readStream));

    await pipeline(transformedReadStream, writeStream);

    successHandler();
  } catch (err) {
    errorHandler(err);
  }
}

convertFronCsvToJson();
