const fs = require('fs');
const path = require('path');
const util = require('util');
const { Transform, pipeline } = require('stream');

const pipelineAsync = util.promisify(pipeline);

let fieldNames = null;

const convertToObject = data => {
  return fieldNames.reduce((res, fieldName, index) => {
    return { ...res, [fieldName]: data[index].trim() };
  }, {});
};

const transformToJSON = () => {
  let isFirstChunk = true;
  let lastLine = '';

  return new Transform({
    transform(chunk, encoding, callback) {
      try {
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

        callback(null, `${initialStartResString}${formattedData.join('')}`);
      } catch (err) {
        callback(err);
      }
    },
    flush(callback) {
      // This condition is for closing array bracket.
      callback(null, '\n]');
    },
  });
};

const readStream = fs.createReadStream(path.join(__dirname, '../assets/test.csv'));
const writeStream = fs.createWriteStream(path.join(__dirname, '../assets/test.json'));

const errorHandler = err => console.error(err);
const successHandler = () => console.log('File converted from csv to json.');

// --------------------------------------------------------------------
// We can handle errors for each stream or use pipeline for this reason.
// --------------------------------------------------------------------

// readStream
//   .on('error', errorHandler)
//   .pipe(transformToJSON())
//   .on('error', errorHandler)
//   .pipe(writeStream)
//   .on('error', errorHandler)
//   .on('finish', successHandler);

async function convertFronCsvToJson() {
  try {
    await pipelineAsync(readStream, transformToJSON(), writeStream);

    successHandler();
  } catch (err) {
    errorHandler(err);
  }
}

convertFronCsvToJson();
