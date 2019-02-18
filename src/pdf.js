const chromeLauncher = require('chrome-launcher');
const cp = require('child_process');
const chromeRemote = require('chrome-remote-interface');
const crypto = require('crypto');
const isWsl = require('is-wsl');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const tempy = require('tempy');

function wslTempFile(ext) {
  const name = [...crypto.randomBytes(8)]
    .flatMap(b => [Math.floor(b / 16), b % 16])
    .map(n => n.toString(16))
    .join('');
  return cp
    .execFileSync('cmd.exe', ['/C', `echo %temp%\\${name}.${ext}`])
    .toString()
    .trim();
}

function isWslPath(file) {
  return file.startsWith('/mnt/') && file[6] === '/';
}

function winToWsl(winPath) {
  return `/mnt/${winPath[0].toLowerCase()}/${winPath
    .slice(3)
    .replace(/\\/g, '/')}`;
}

function wslToWin(wslPath) {
  return `${wslPath[5].toUpperCase()}:\\${wslPath
    .slice(7)
    .replace(/\//g, '\\')}`;
}

async function pdf(input_path, output) {
  let input;
  if (!isWsl && input_path === 'stdin') {
    input = tempy.file({ extension: 'html' });
    fs.writeFileSync(input, fs.readFileSync(0, 'utf8'));
  } else if (!isWsl) {
    input = path.resolve(input_path);
  } else if (input_path === 'stdin') {
    // Special handling in wsl since chrome needs windows paths
    input = wslTempFile('html');
    fs.writeFileSync(winToWsl(input), fs.readFileSync(0, 'utf8'));
  } else {
    const absolute = path.resolve(input_path);
    if (isWslPath(absolute)) {
      input = wslToWin(absolute);
    } else {
      input = wslTempFile('html');
      fs.copyFileSync(absolute, winToWsl(input));
    }
  }
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu'],
    // TODO Handle starting url for windows
    startingUrl: `file://${input}`,
  });
  const protocol = await chromeRemote({ port: chrome.port });
  const { Page, Runtime } = protocol;
  await Promise.all([Page.enable(), Runtime.enable()]);

  try {
    // await page load
    // Sometimes the promise fails, so we try with back off
    let description;
    for (let timeout = 1; timeout < 1000; timeout *= 2) {
      description = undefined;
      try {
        // eslint-disable-next-line no-await-in-loop
        const { result } = await Runtime.evaluate({
          expression: '__princ.rendered',
        });
        if (result.subtype === 'error') {
          throw new Error(result.description);
        }
        // eslint-disable-next-line no-await-in-loop
        ({
          result: { description },
        } = await Runtime.awaitPromise({
          promiseObjectId: result.objectId,
        }));
        break;
      } catch (err) {
        description = err;
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, timeout));
      }
    }
    if (description !== undefined) {
      throw description;
    }

    const {
      result: {
        value: { width, height },
      },
    } = await Runtime.evaluate({
      expression:
        'rect = document.documentElement.getBoundingClientRect(); res = {width: rect.width, height: rect.height}',
      returnByValue: true,
    });
    const { data } = await Page.printToPDF({
      displayHeaderFooter: false,
      printBackground: true,
      paperWidth: width / 96.0,
      paperHeight: height / 96.0,
      pageRanges: '1',
    });

    const buff = new stream.Readable();
    buff._read = () => {}; // eslint-disable-line no-underscore-dangle
    buff.push(Buffer.from(data, 'base64'));
    buff.push(null);
    buff.pipe(
      output === 'stdout' ? process.stdout : fs.createWriteStream(output),
    );
  } finally {
    await protocol.close();
    await chrome.kill();
  }
}

module.exports = pdf;
