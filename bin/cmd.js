#!/usr/bin/env node

const yargs = require('yargs');

const plot = require('../src/plot');
const html = require('../src/html');
const append = require('../src/append');
const pdf = require('../src/pdf');
const png = require('../src/png');
const parse = require('../src/parse');

const args = yargs
  .usage(
    '$0 <command>\n\nGenerate and render principia plots. See https://github.com/erikbrinkman/principia#readme for more information.',
  )
  .option('input', {
    alias: 'i',
    default: 'stdin',
    describe: 'Take input svg from file',
  })
  .option('output', {
    alias: 'o',
    default: 'stdout',
    describe: 'Output result to a file',
  })
  .command('auto', 'Convert input data to a viewable graph', (ygs) => ygs)
  .command(
    'parse',
    'Parse multiple input data types into principia json',
    (ygs) => ygs,
  )
  .command('plot', 'Convert a json spec to an svg', (ygs) =>
    ygs
      .option('style', {
        alias: ['css', 'c', 's'],
        array: true,
        default: [],
      })
      .help(false),
  )
  .command('append [stylesheet...]', 'Append css files to an svg', (ygs) =>
    ygs.positional('stylesheet', {
      describe: 'Stylesheet to append to svg',
      type: 'string',
    }),
  )
  .command('html', 'Render an svg as html', (ygs) =>
    ygs
      .option('yaxis-label', {
        type: 'number',
        describe: 'align the y axis label with spacing between top tick',
      })
      .option('yaxis-ticks', {
        type: 'number',
        describe: 'space apart the y axis tick labels',
      })
      .option('xaxis-label', {
        type: 'number',
        describe: 'align the x axis label with spacing between ticks',
      })
      .option('xaxis-ticks', {
        type: 'number',
        describe: 'space apart the x axis tick labels',
      })
      .option('label', {
        type: 'number',
        describe: 'space apart evolution labels',
      })
      .option('name', {
        type: 'number',
        describe: 'align comparisonz names to the left of values with spacing',
      })
      .option('num', {
        type: 'number',
        describe: 'align comparisonz numbers to right of values with spacing',
      }),
  )
  .command('pdf', 'Render html as a pdf')
  .command('png', 'Render a pdf as a png', (ygs) =>
    ygs
      .option('density', {
        describe: 'How densly to sample the pdf for png creation',
        type: 'number',
        default: 300,
      })
      .option('quality', {
        describe: 'The png quality',
        type: 'number',
        default: 100,
      }),
  )
  .help()
  .alias('help', 'h')
  .alias('version', 'V').argv;

(async () => {
  switch (args._[0]) {
    case 'plot': {
      plot(args.$0, args.input, args.output, args.style, args.h, args.help);
      break;
    }
    case 'html': {
      html(args.input, args.output, args);
      break;
    }
    case 'append': {
      append(args.input, args.output, args.stylesheet);
      break;
    }
    case 'pdf': {
      await pdf(args.input, args.output);
      break;
    }
    case 'png': {
      png(args.input, args.output, args.density, args.quality);
      break;
    }
    case 'parse': {
      parse(args.input, args.output);
      break;
    }
    case 'auto':
    case undefined: {
      // FIXME run all
      break;
    }
    default: {
      throw Error(`unknown command: ${args._[0]}`);
    }
  }
})().catch((err) => {
  process.stderr.write(`${err.toString()}\n`);
  process.exit(1);
});
