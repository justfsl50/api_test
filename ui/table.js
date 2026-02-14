const chalk = require('chalk');
const { palette } = require('./palette');

const pad = (s, w) => String(s).padEnd(w);
const line = (label, value) => `  ${palette.muted(pad(label + ':', 16))} ${value || '-'}`;

function profileTable(profile) {
  const rows = [
    ['Name', profile.name],
    ['CRN', profile.crn],
    ['DOB', profile.dob],
    ['Email', profile.email],
    ['Personal Email', profile.personalEmail],
    ['Phone', profile.phone],
    ['Father', profile.fatherName],
    ['Mother', profile.motherName],
    ['Bank', profile.bank ? `${profile.bank.bankName} (${profile.bank.ifsc})` : null],
    ['Aadhar', profile.documents?.aadhar]
  ];
  return rows.map(([k, v]) => line(k, v)).join('\n') + '\n';
}

function attendanceTable(attendance) {
  const a = attendance;
  const pctColor = a.percentage >= 75 ? palette.success : a.percentage >= 50 ? palette.warn : palette.error;
  return [
    line('Total', a.totalClasses),
    line('Present', palette.success(a.classesAttended)),
    line('Absent', palette.error(a.classesAbsent)),
    line('Percentage', pctColor(`${a.percentage}%`))
  ].join('\n') + '\n';
}

function subjectsTable(subjects) {
  return subjects.map(s => `  ${palette.accent('•')} ${s.code}  ${s.name}`).join('\n') + '\n';
}

function allAttendanceTable(data) {
  const colorFn = (pct) => pct >= 75 ? palette.success : pct >= 50 ? palette.warn : palette.error;
  const pctOverall = parseFloat(data.overall.percentage) || 0;
  const lines = [
    `  ${palette.accent('OVERALL')}  ${data.overall.classesAttended}/${data.overall.totalClasses}  ${colorFn(pctOverall)(`${data.overall.percentage}%`)}`
  ];
  data.subjects.forEach(s => {
    const pct = parseFloat(s.percentage) || 0;
    lines.push(`  ${palette.accent('•')} ${s.code}  ${s.classesAttended}/${s.totalClasses}  ${colorFn(pct)(`${s.percentage}%`)}  ${s.name}`);
  });
  return lines.join('\n') + '\n';
}

function timetableTable(timetable) {
  let out = '';
  timetable.forEach(day => {
    out += palette.accent(`\n  ${day.day}\n`);
    day.periods.forEach(p => {
      if (p.type === 'lunch') out += `    ${p.time}  ${palette.muted('LUNCH')}\n`;
      else if (p.type === 'free') out += `    ${p.time}  ${palette.muted('Free')}\n`;
      else out += `    ${p.time}  ${p.subject} (${p.code})  ${palette.muted(p.classType + (p.isSuspended ? ' [SUSPENDED]' : ''))}\n`;
    });
  });
  return out + '\n';
}

function todayTable(data) {
  const statusColor = { present: palette.success, absent: palette.error, suspended: palette.warn };
  const lines = data.periods.map(p => {
    if (p.type === 'lunch') return `  ${p.time}  ${palette.muted('LUNCH')}`;
    if (p.type === 'free') return `  ${p.time}  ${palette.muted('Free')}`;
    const col = statusColor[p.attendanceStatus] || chalk.white;
    return `  ${p.time}  ${p.subject} (${p.code})  ${col(p.attendanceStatus?.toUpperCase() || '-')}`;
  });
  return lines.join('\n') + '\n';
}

module.exports = {
  profileTable,
  attendanceTable,
  subjectsTable,
  allAttendanceTable,
  timetableTable,
  todayTable
};
