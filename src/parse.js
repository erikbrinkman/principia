const fs = require('fs');

function parse(input, output) {
  const raw = fs.readFileSync(input === 'stdin' ? 0 : input, 'utf8').trim();
  const result = raw;
  if (output === 'stdout') {
    fs.appendFileSync(1, result, 'utf-8');
  } else {
    fs.writeFileSync(output, result, 'utf-8');
  }
}

module.exports = parse;
