# NodeJS streams example

## Requirements

This example does parsing CSV files to JSON by implementing a custom NODE.js **transform** stream 
and provides errors handling for converting process.
Also you can generate CSV file (about 10 gigabyte) base on [mock csv file](./assets/test.csv)
and use it as an source file for this tool. 
When running the parser **you can check the RAM** that is taken by the process.

## Small description

We can use stream by two ways: callback and iterators, so you can find examples for both in src folder. In these files ([generate with callback](./src/generate.js), [generate with iterators](./src/generate-async-iteration.js)) you can find logic for creating big file (about 10 gigabyte) based on first part of [mock csv file](./assets/test.csv). In these files ([parse with callback](./src/parse.js), [parse with iterators](./src/parse-async-iteration.js)) you can find logic for parsing CSV to JSON.


## Commands

For running scripts please use next command:

```bash
// run converting for small file (callback example)
npm run parse

// run converting for small file (example with iterators)
npm run parse-with-iterator

// run generating about 10gb file (callback example)
npm run generate-big-file

// run generating about 10gb file (example with iterators)
npm run generate-big-file-with-iterator

// run converting for about 10gb file (callback example)
npm run parse-big

// run converting for about 10gb file (example with iterators)
npm run parse-big-with-iterator
```
