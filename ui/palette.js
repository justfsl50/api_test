const chalk = require('chalk');

const noColor = process.env.NO_COLOR === '1' || process.argv.includes('--no-color');

const palette = {
  muted: noColor ? (s) => s : (s) => chalk.hex('#8B7F77')(s),
  error: noColor ? (s) => s : (s) => chalk.hex('#E23D2D')(s),
  warn: noColor ? (s) => s : (s) => chalk.hex('#FFB020')(s),
  success: noColor ? (s) => s : (s) => chalk.hex('#2FBF71')(s),
  info: noColor ? (s) => s : (s) => chalk.hex('#FF8A5B')(s),
  accentDim: noColor ? (s) => s : (s) => chalk.hex('#D14A22')(s),
  accentBright: noColor ? (s) => s : (s) => chalk.hex('#FF7A3D')(s),
  accent: noColor ? (s) => s : (s) => chalk.hex('#FF5A2D')(s)
};

module.exports = { palette, noColor };
