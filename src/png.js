const cp = require('child_process');

function png(input, output, density, quality) {
  cp.execFileSync(
    'convert',
    [
      '-density',
      density,
      input === 'stdin' ? '-' : input,
      '-quality',
      quality,
      output === 'stdout' ? '-' : output,
    ],
    { stdio: 'inherit' },
  );
}

module.exports = png;
