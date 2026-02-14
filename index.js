#!/usr/bin/env node

const inquirer = require('inquirer');
const ora = require('ora');
const { ERPClient, loadSession, clearSession } = require('./api/erpClient');
const { palette } = require('./ui/palette');
const { renderBanner, renderAxisBox, renderHelpHeader } = require('./ui/banner');
const { profileTable, attendanceTable, subjectsTable, allAttendanceTable, timetableTable, todayTable } = require('./ui/table');
const { doLogin } = require('./commands/login');
const { help } = require('./commands/help');
const { ensureSession } = require('./commands/attendance');

const pkg = require('./package.json');

const MENU_CHOICES = [
  { name: 'Profile', value: 'profile' },
  { name: 'Attendance', value: 'attendance' },
  { name: 'Subjects', value: 'subjects' },
  { name: 'Timetable', value: 'timetable' },
  { name: "Today's Schedule", value: 'today' },
  { name: 'Bunk Calculator', value: 'bunk' },
  { name: 'Last Visit', value: 'lastVisit' },
  new inquirer.Separator('---'),
  { name: 'Help', value: 'help' },
  { name: 'Logout', value: 'logout' }
];

const AFTER_ACTION_CHOICES = [
  { name: 'Back to menu', value: 'back' },
  { name: 'Logout', value: 'logout' }
];

async function runInteractive() {
  console.log(renderHelpHeader(pkg.version));
  console.log(await renderBanner());
  console.log(await renderAxisBox());

  const client = new ERPClient();
  await ensureSession(client);

  const health = await client.healthCheck();
  if (health.ok) {
    console.log(palette.muted(`  Health: ${health.health.status} | Uptime: ${Math.round(health.health.uptime)}s\n`));
  }

  while (true) {
    console.log(palette.accent('Choose an option ---\n'));
    const { choice } = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: 'Select',
      choices: MENU_CHOICES,
      pageSize: 15
    }]);

    if (choice === 'logout') {
      clearSession();
      await client.closeSession();
      console.log(palette.success('\nLogged out. Run `aitm-erp` to login again.\n'));
      return;
    }

    const spinner = ora();
    try {
      switch (choice) {
        case 'profile': {
          spinner.start('Fetching profile...');
          const r = await client.getProfile();
          spinner.succeed('Loaded');
          console.log(palette.accent('\nProfile ---\n'));
          console.log(profileTable(r.profile));
          break;
        }
        case 'attendance': {
          spinner.start('Fetching attendance...');
          const [att, all] = await Promise.all([client.getAttendance(), client.getAllAttendance()]);
          spinner.succeed('Loaded');
          console.log(palette.accent('\nOverall Attendance ---\n'));
          console.log(attendanceTable(att.attendance));
          console.log(palette.accent('\nAll Subjects ---\n'));
          console.log(allAttendanceTable(all));
          break;
        }
        case 'subjects': {
          spinner.start('Fetching subjects...');
          const r = await client.getSubjects();
          spinner.succeed('Loaded');
          console.log(palette.accent('\nSubjects ---\n'));
          console.log(subjectsTable(r.subjects));
          break;
        }
        case 'timetable': {
          spinner.start('Fetching timetable...');
          const r = await client.getTimetable();
          spinner.succeed('Loaded');
          console.log(palette.accent('\nTimetable ---\n'));
          console.log(timetableTable(r.timetable));
          break;
        }
        case 'today': {
          spinner.start("Fetching today's schedule...");
          const r = await client.getToday();
          spinner.succeed('Loaded');
          console.log(palette.accent(`\n${r.day} | ${r.date} ---\n`));
          if (r.message) console.log(palette.muted(r.message + '\n'));
          console.log(todayTable(r));
          const s = r.summary;
          console.log(palette.accent(`\nSummary: ${s.totalPeriods} classes | Present: ${s.present} | Absent: ${s.absent}\n`));
          break;
        }
        case 'bunk': {
          spinner.start('Fetching attendance...');
          const all = await client.getAllAttendance();
          spinner.succeed('Loaded');
          const overall = bunkCalc(all.overall.classesAttended, all.overall.totalClasses);
          console.log(palette.accent('\nBunk Calculator ---\n'));
          console.log(palette.info(`  Overall: ${overall.message}\n`));
          all.subjects.forEach(s => {
            const b = bunkCalc(s.classesAttended, s.totalClasses);
            const status = b.canBunk > 0 ? palette.success('OK') : palette.warn('Low');
            console.log(`  ${palette.accent('•')} ${s.code}  ${s.classesAttended}/${s.totalClasses}  ${s.percentage}%  can bunk: ${b.canBunk}  ${status}`);
          });
          console.log('');
          break;
        }
        case 'lastVisit': {
          spinner.start('Fetching last visit...');
          const r = await client.getLastVisit();
          spinner.succeed('Loaded');
          const v = r.lastVisit;
          console.log(palette.accent('\nLast Visit ---\n'));
          console.log(`  ${v.greeting}, ${v.name}`);
          console.log(`  Last visit: ${v.lastVisitTime}\n`);
          break;
        }
        case 'help': {
          await help();
          continue;
        }
        default:
          continue;
      }

      const { next } = await inquirer.prompt([{
        type: 'list',
        name: 'next',
        message: 'What next?',
        choices: AFTER_ACTION_CHOICES,
        pageSize: 5
      }]);

      if (next === 'logout') {
        clearSession();
        await client.closeSession();
        console.log(palette.success('\nLogged out. Run `aitm-erp` to login again.\n'));
        return;
      }
    } catch (e) {
      spinner.fail(palette.error(e.message));
      const { retry } = await inquirer.prompt([{
        type: 'list',
        name: 'retry',
        message: 'What next?',
        choices: [{ name: 'Back to menu', value: 'back' }]
      }]);
    }
  }
}

function bunkCalc(attended, total, targetPct = 75) {
  if (total === 0) return { canBunk: 0, message: 'No classes yet' };
  const minAttended = Math.ceil((targetPct / 100) * total);
  const canBunk = attended - minAttended;
  return {
    canBunk: Math.max(0, canBunk),
    minAttended,
    message: canBunk >= 0
      ? `You can bunk ${canBunk} more class(es) and stay above ${targetPct}%`
      : `You need to attend ${-canBunk} more class(es) to reach ${targetPct}%`
  };
}

if (process.argv.includes('--version') || process.argv.includes('-V')) {
  console.log(pkg.version);
  process.exit(0);
}

runInteractive().catch((e) => {
  console.error(palette.error(e.message));
  process.exit(1);
});
