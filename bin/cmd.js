#!/usr/bin/env node

const chromeLauncher = require('chrome-launcher');
const chromeRemote = require('chrome-remote-interface');
const CleanCSS = require('clean-css');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const tempy = require('tempy');
const uglifyes = require('uglify-es');
const yargs = require('yargs');

const args = yargs
  .usage('$0 <command>\n\nGenerate and render principia plots. See https://github.com/erikbrinkman/principia#readme for more information.')
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
  .command('plot', 'Convert a json spec to an svg', ygs => ygs.help(false))
  .command('append [stylesheet...]', 'Append css files to an svg', ygs => ygs
    .positional('stylesheet', {
      describe: 'Stylesheet to append to svg',
      type: 'string',
    }))
  .command('html', 'Render an svg as html', ygs => ygs
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
    }))
  .command('pdf', 'Render html as a pdf')
  .command('png', 'Render a pdf as a png', ygs => ygs
    .option('density', {
      describe: 'How densly to sample the pdf for png creation',
      type: 'number',
      default: 300,
    })
    .option('quality', {
      describe: 'The png quality',
      type: 'number',
      default: 100,
    }))
  .help()
  .alias('help', 'h')
  .alias('version', 'V')
  .argv;

const root = path.dirname(__dirname);
const resources = path.join(root, 'resources');

(async () => {
  switch (args._[0]) {
    case 'plot': {
      const params = ['-i', args.input, '-o', args.output].concat(
        args.help ? ['--help'] : [],
        args.h ? ['-h'] : [],
      );
      // XXX This is necessary because principia-plot may not be installed
      // where we want it. I could not find a better solution.
      const exec = [root, 'node_modules', '.bin', 'principia-plot'];
      while (!fs.existsSync(path.join(...exec))) {
        exec.splice(-3, 0, '..');
      }
      const env = JSON.parse(JSON.stringify(process.env));
      // eslint-disable-next-line no-underscore-dangle
      env.__PRINC_NAME__ = `${args.$0} plot`;
      cp.execFileSync(path.join(...exec), params, { stdio: 'inherit', env });
      break;
    }
    case 'html': {
      const cleancss = new CleanCSS();
      const svg = fs.readFileSync(args.input === 'stdin' ? 0 : args.input, 'utf8').trim();
      if (!svg.startsWith('<svg')) {
        throw Error('an svg must start with "<svg"');
      }
      // TODO Make these async
      const style = cleancss.minify(fs.readFileSync(path.join(resources, 'style.css'), 'utf8')).styles;
      const quadprog = uglifyes.minify(fs.readFileSync(path.join(resources, 'quadprog.js'), 'utf8')).code;
      const preScript = uglifyes.minify(fs.readFileSync(path.join(resources, 'pre_script.js'), 'utf8')).code;
      const postScript = uglifyes.minify(fs.readFileSync(path.join(resources, 'post_script.js'), 'utf8')).code;

      const buff = new stream.Readable();
      buff.push('<!doctype html><html><head><style>');
      buff.push(style);
      buff.push('</style></head><body>');
      buff.push(svg);
      buff.push('<script>"use strict";addEventListener("load", async () => {');
      buff.push(quadprog);
      buff.push(preScript);

      // Optional alignment
      if (args.name !== undefined) {
        buff.push(`await alignComparisonZNames(${args.name});`);
      }
      if (args.num !== undefined) {
        buff.push(`await alignComparisonZNums(${args.num});`);
      }
      if (args.label !== undefined) {
        buff.push(`await spaceApartEvolutionLabels(${args.label});`);
      }
      if (args['yaxis-ticks'] !== undefined) {
        buff.push(`await spaceApartYAxisTickLabels(${args['yaxis-ticks']});`);
      }
      if (args['yaxis-label'] !== undefined) {
        buff.push(`await alignYAxisLabel(${args['yaxis-label']});`);
      }
      if (args['xaxis-ticks'] !== undefined) {
        buff.push(`await spaceApartXAxisTickLabels(${args['xaxis-ticks']});`);
      }
      if (args['xaxis-label'] !== undefined) {
        buff.push(`await alignXAxisLabel(${args['xaxis-label']}, true);`);
      }

      buff.push(postScript);
      buff.push('});</script></body></html>');
      buff.push(null);
      buff.pipe(args.output === 'stdout' ? process.stdout : fs.createWriteStream(args.output));
      break;
    }
    case 'append': {
      const cleancss = new CleanCSS();
      const svg = fs.readFileSync(args.input === 'stdin' ? 0 : args.input, 'utf8').trim();
      const end = '</style></svg>';
      if (!svg.startsWith('<svg') || !svg.endsWith(end)) {
        throw Error('a principia svg must start with "<svg" and end with "</style></svg>"');
      }
      const buff = new stream.Readable();
      buff.push(svg.slice(0, -end.length));
      args.stylesheet.forEach((file) => {
        const minified = cleancss.minify(fs.readFileSync(file === '-' ? 0 : file, 'utf8'));
        if (minified.errors.length) {
          throw new Error(`Couldn't parse css from file ${file}. Got errors ${minified.errors.join(' ')}`);
        } else if (minified.warnings.length) {
          throw new Error(`Couldn't parse css from file ${file}. Got warnings ${minified.warnings.join(' ')}`);
        } else {
          buff.push(minified.styles);
        }
      });
      buff.push(end);
      buff.push(null);
      buff.pipe(args.output === 'stdout' ? process.stdout : fs.createWriteStream(args.output));
      break;
    }
    case 'pdf': {
      if (args.input === 'stdin') {
        args.input = tempy.file({ extension: 'html' });
        fs.writeFileSync(args.input, fs.readFileSync(0, 'utf8'));
      }
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu'],
        // TODO Handle starting url for windows
        startingUrl: `file://${path.resolve(args.input)}`,
      });
      const protocol = await chromeRemote({ port: chrome.port });
      const { Page, Runtime } = protocol;
      await Promise.all([Page.enable(), Runtime.enable()]);
      // FIXME Need an extra check to make sure page has finished rendering
      const { result: { value: { width, height } } } = await Runtime.evaluate({
        expression: 'rect = document.documentElement.getBoundingClientRect(); res = {width: rect.width, height: rect.height}',
        returnByValue: true,
      });
      const { data } = await Page.printToPDF({
        displayHeaderFooter: false,
        printBackground: true,
        paperWidth: width / 96.0,
        paperHeight: height / 96.0,
        pageRanges: '1',
      });
      await protocol.close();
      await chrome.kill();

      const buff = new stream.Readable();
      buff.push(Buffer.from(data, 'base64'));
      buff.push(null);
      buff.pipe(args.output === 'stdout' ? process.stdout : fs.createWriteStream(args.output));
      break;
    }
    case 'png': {
      cp.execFileSync(
        'convert', [
          '-density', args.density,
          args.input === 'stdin' ? '-' : args.input,
          '-quality', args.quality,
          args.output === 'stdout' ? '-' : args.output],
        { stdio: 'inherit' },
      );
      break;
    }
    default: {
      if (args._[0] === undefined) {
        throw Error('must specify a command');
      } else {
        throw Error(`unknown command: ${args._[0]}`);
      }
    }
  }
})().catch((err) => {
  process.stderr.write(`${err.toString()}\n`);
  process.exit(1);
});
