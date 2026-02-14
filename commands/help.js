const { renderBanner, renderAxisBox, renderHelpHeader } = require('../ui/banner');
const { palette } = require('../ui/palette');
const pkg = require('../package.json');

const MENU_OPTIONS = [
  ['Profile', 'View your student profile'],
  ['Attendance', 'Overall and subject-wise attendance'],
  ['Subjects', 'List all subjects'],
  ['Timetable', 'Weekly timetable'],
  ["Today's Schedule", "Today's classes and attendance"],
  ['Bunk Calculator', 'See how many classes you can bunk'],
  ['Last Visit', 'Last login info'],
  ['Logout', 'Clear session and exit']
];

async function help() {
  console.log(renderHelpHeader(pkg.version));
  console.log(await renderBanner());
  console.log(await renderAxisBox());

  console.log(palette.accent('\nMenu options ---\n'));
  MENU_OPTIONS.forEach(([name, desc]) => {
    console.log(`  - ${palette.accentBright(name.padEnd(18))} ${desc}`);
  });

  console.log(palette.accent('\nUsage ---\n'));
  console.log('  Run: aitm-erp');
  console.log('  Use arrow keys to select, Enter to confirm\n');

  console.log(palette.muted('Flags: --no-color, -V or --version'));
  console.log(palette.muted('Docs: https://www.npmjs.com/package/aitm-erp\n'));
}

module.exports = { help };
