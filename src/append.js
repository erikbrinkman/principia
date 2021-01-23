const CleanCSS = require('clean-css');
const fs = require('fs');
const stream = require('stream');

function append(input, output, stylesheet) {
  const cleancss = new CleanCSS();
  const svg = fs.readFileSync(input === 'stdin' ? 0 : input, 'utf8').trim();
  const end = '</style></svg>';
  if (!svg.startsWith('<svg') || !svg.endsWith(end)) {
    throw Error(
      'a principia svg must start with "<svg" and end with "</style></svg>"',
    );
  }
  const buff = new stream.Readable();
  buff._read = () => {}; // eslint-disable-line no-underscore-dangle
  buff.push(svg.slice(0, -end.length));
  stylesheet.forEach((file) => {
    const minified = cleancss.minify(
      fs.readFileSync(file === '-' ? 0 : file, 'utf8'),
    );
    if (minified.errors.length) {
      throw new Error(
        `Couldn't parse css from file ${file}. Got errors ${minified.errors.join(
          ' ',
        )}`,
      );
    } else if (minified.warnings.length) {
      throw new Error(
        `Couldn't parse css from file ${file}. Got warnings ${minified.warnings.join(
          ' ',
        )}`,
      );
    } else {
      buff.push(minified.styles);
    }
  });
  buff.push(end);
  buff.push(null);
  buff.pipe(
    output === 'stdout' ? process.stdout : fs.createWriteStream(output),
  );
}

module.exports = append;
