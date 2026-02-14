const chalk = require('chalk');
const figlet = require('figlet');

function centerBlock(block, width) {
  return block.split('\n').map(line => {
    const pad = Math.max(0, Math.floor((width - line.length) / 2));
    return ' '.repeat(pad) + line;
  }).join('\n');
}

function centerBlockAsUnit(block, refWidth, trimBlock = true) {
  const lines = trimBlock ? block.trim().split('\n') : block.split('\n').filter(l => l.length > 0);
  const blockWidth = lines.length ? Math.max(...lines.map(l => l.length)) : 1;
  const leftPad = Math.max(0, Math.floor((refWidth - blockWidth) / 2));
  return lines.map(line => ' '.repeat(leftPad) + line).join('\n');
}

/** Find the visual center of a block (center of content, ignoring outer whitespace). */
function contentCenter(block) {
  const lines = block.split('\n').filter(l => l.length > 0);
  let left = Infinity, right = -Infinity;
  for (const line of lines) {
    const first = line.search(/\S/);
    if (first !== -1) left = Math.min(left, first);
    for (let i = line.length - 1; i >= 0; i--) {
      if (/\S/.test(line[i])) {
        right = Math.max(right, i);
        break;
      }
    }
  }
  if (left === Infinity || right === -Infinity) return 0;
  return (left + right) / 2;
}

async function renderBanner() {
  const line1 = figlet.textSync('Axis Colleges', { horizontalLayout: 'full' });
  const line2 = figlet.textSync('AITM ERP', { font: 'Small', horizontalLayout: 'full' });
  const width1 = Math.max(...line1.split('\n').map(l => l.length));
  const axisCenter = contentCenter(line1);
  const aitmContentCenter = contentCenter(line2);
  const leftPad = Math.max(0, Math.floor(axisCenter - aitmContentCenter));
  const rightPad = width1 - leftPad - Math.max(...line2.split('\n').map(l => l.length));
  const centered2 = line2.split('\n').filter(l => l.length > 0)
    .map(line => ' '.repeat(leftPad) + line + ' '.repeat(Math.max(0, rightPad))).join('\n');
  const combined = line1 + '\n' + centered2;
  const termWidth = process.stdout.columns || 80;
  const blockWidth = Math.max(...combined.split('\n').map(l => l.length));
  const text = centerBlockAsUnit(combined, termWidth, false);
  try {
    const gradient = (await import('gradient-string')).default;
    const g = gradient(['#1E3A8A', '#5B4FFF', '#FFD700']);
    return g.multiline(text);
  } catch {
    try {
      const { pastel } = await import('gradient-string');
      return pastel.multiline(text);
    } catch {
      return chalk.cyan(text);
    }
  }
}

function renderHelpHeader(version) {
  const { palette } = require('./palette');
  return palette.accentBright(`AITM ERP ${version} (Axis Colleges)`) + '\n' +
    palette.muted('Track attendance, marks, and subjects from the terminal.') + '\n';
}

async function renderAxisBox() {
  const msg = 'Student ERP CLI - Track attendance, marks, subjects';
  const termWidth = process.stdout.columns || 80;
  const pad = Math.max(0, Math.floor((termWidth - msg.length) / 2));
  return chalk.hex('#5B4FFF')(' '.repeat(pad) + msg) + '\n';
}

async function renderGoodbye() {
  let text = figlet.textSync('Goodbye', { horizontalLayout: 'full' });
  try {
    const { pastel } = await import('gradient-string');
    text = pastel.multiline(text);
  } catch {
    text = chalk.cyan(text);
  }
  return text;
}

module.exports = { renderBanner, renderAxisBox, renderGoodbye, renderHelpHeader };
