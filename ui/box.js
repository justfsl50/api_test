const chalk = require('chalk');

async function box(content, options = {}) {
  const opts = {
    padding: 1,
    borderColor: 'cyan',
    borderStyle: 'round',
    ...options
  };
  try {
    const boxen = (await import('boxen')).default;
    return boxen(content, opts);
  } catch {
    return content;
  }
}

function boxSync(content, options = {}) {
  try {
    const boxen = require('boxen');
    return boxen(content, { padding: 1, borderColor: 'cyan', borderStyle: 'round', ...options });
  } catch {
    return content;
  }
}

module.exports = { box, boxSync };
