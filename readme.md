# Csv to json parser

## Description

You need to build a command line tool which allows the user to convert CSV files to JSON.

## Requirements

You need to build parsing CSV files to JSON by implementing a custom NODE.js **transform** stream.
Provide errors handling for converting process and incorrect command line arguments.

### Testing

Write a function that generates at least 10 gigabyte CSV file base on the filled in with [mock csv file](./assets/test.csv)
Generate a CSV file and use it as an source file for your tool. When running the parser **pay attention to the RAM** that is taken by the process.

