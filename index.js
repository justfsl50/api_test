#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const open = require('open');

const BASE_URL = 'https://erptestbackend-production.up.railway.app';

class ERPClient {
  constructor() {
    this.sessionId = null;
  }

  async callAPI(method, endpoint, data = {}) {
    const url = `${BASE_URL}${endpoint}`;
    try {
      if (method === 'GET') {
        const response = await axios.get(url, { timeout: 30000 });
        return response.data;
      } else {
        const response = await axios.post(url, data, { timeout: 120000 });
        return response.data;
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  async healthCheck() {
    console.log(chalk.cyan('\n=== Health Check ==='));
    try {
      const health = await this.callAPI('GET', '/health');
      console.log(chalk.green(`Status: ${health.status} | Uptime: ${Math.round(health.uptime)}s | Sessions: ${health.activeSessions}`));
      return true;
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      return false;
    }
  }

  async login() {
    console.log(chalk.cyan('\n=== Login ==='));
    
    const credentials = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Enter your roll number:',
        validate: input => input.length > 0 || 'Roll number is required'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        mask: '*',
        validate: input => input.length > 0 || 'Password is required'
      }
    ]);

    const spinner = ora('Getting CAPTCHA...').start();
    
    try {
      const captchaResp = await this.callAPI('POST', '/api/get-captcha', credentials);
      this.sessionId = captchaResp.sessionId;
      spinner.succeed(chalk.green(`Session: ${this.sessionId}`));

      // Save CAPTCHA image
      const imgData = captchaResp.captchaImage.replace(/^data:image\/png;base64,/, '');
      const imgPath = path.join(process.cwd(), 'captcha.png');
      fs.writeFileSync(imgPath, Buffer.from(imgData, 'base64'));
      
      console.log(chalk.yellow(`CAPTCHA saved to: ${imgPath}`));
      console.log(chalk.yellow('Opening CAPTCHA...'));
      
      try {
        await open(imgPath);
      } catch (e) {
        console.log(chalk.yellow('Could not auto-open CAPTCHA. Please open captcha.png manually.'));
      }

      let loggedIn = false;

      while (!loggedIn) {
        const { captcha } = await inquirer.prompt([
          {
            type: 'input',
            name: 'captcha',
            message: 'Enter the CAPTCHA you see:',
            validate: input => input.length > 0 || 'CAPTCHA is required'
          }
        ]);

        const loginSpinner = ora('Submitting CAPTCHA...').start();

        try {
          const loginResp = await this.callAPI('POST', '/api/submit-captcha', {
            sessionId: this.sessionId,
            captcha: captcha
          });

          if (loginResp.success) {
            loginSpinner.succeed(chalk.green('Login successful!'));
            loggedIn = true;
            
            console.log(chalk.green('\n========================================'));
            console.log(chalk.green('  LOGIN SUCCESSFUL'));
            console.log(chalk.green('========================================'));
            console.log(`  Name:     ${loginResp.student.name}`);
            console.log(`  CRN:      ${loginResp.student.crn}`);
            console.log(`  Roll No:  ${loginResp.student.rollNo}`);
            console.log(`  Program:  ${loginResp.student.program}`);
            console.log(`  Branch:   ${loginResp.student.branch}`);
            console.log(`  Semester: ${loginResp.student.semester}`);
            console.log(chalk.green('========================================\n'));
          }
        } catch (error) {
          loginSpinner.fail(chalk.red('Login failed. Refreshing CAPTCHA...'));
          
          try {
            const refreshResp = await this.callAPI('POST', '/api/refresh-captcha', {
              sessionId: this.sessionId
            });
            
            const newImgData = refreshResp.captchaImage.replace(/^data:image\/png;base64,/, '');
            fs.writeFileSync(imgPath, Buffer.from(newImgData, 'base64'));
            console.log(chalk.yellow('New CAPTCHA saved. Opening...'));
            
            try {
              await open(imgPath);
            } catch (e) {
              console.log(chalk.yellow('Please check captcha.png'));
            }
          } catch (refreshError) {
            console.log(chalk.red(`Refresh failed: ${refreshError.message}`));
            throw refreshError;
          }
        }
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      throw error;
    }
  }

  async showProfile() {
    console.log(chalk.cyan('\n=== Profile ==='));
    const spinner = ora('Fetching profile...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/profile', { sessionId: this.sessionId });
      spinner.succeed('Profile loaded');
      
      const p = r.profile;
      console.log(`  Name:           ${p.name}`);
      console.log(`  CRN:            ${p.crn}`);
      console.log(`  DOB:            ${p.dob}`);
      console.log(`  Email:          ${p.email}`);
      console.log(`  Personal Email: ${p.personalEmail}`);
      console.log(`  Phone:          ${p.phone}`);
      console.log(`  Father:         ${p.fatherName}`);
      console.log(`  Mother:         ${p.motherName}`);
      console.log(`  Bank:           ${p.bank.bankName} (${p.bank.ifsc})`);
      console.log(`  Aadhar:         ${p.documents.aadhar}`);
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showDashboard() {
    console.log(chalk.cyan('\n=== Dashboard ==='));
    const spinner = ora('Fetching dashboard...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/dashboard', { sessionId: this.sessionId });
      spinner.succeed('Dashboard loaded');
      
      const d = r.dashboard;
      console.log(`  Name:     ${d.name}`);
      console.log(`  CRN:      ${d.crn}`);
      console.log(`  Roll No:  ${d.rollNo}`);
      console.log(`  Program:  ${d.program}`);
      console.log(`  Branch:   ${d.branch}`);
      console.log(`  Section:  ${d.section}`);
      console.log(`  Semester: ${d.semester}`);
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showAttendance() {
    console.log(chalk.cyan('\n=== Overall Attendance ==='));
    const spinner = ora('Fetching attendance...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/attendance', { sessionId: this.sessionId });
      spinner.succeed('Attendance loaded');
      
      const a = r.attendance;
      console.log(chalk.white(`  Total:    ${a.totalClasses}`));
      console.log(chalk.green(`  Present:  ${a.classesAttended}`));
      console.log(chalk.red(`  Absent:   ${a.classesAbsent}`));
      console.log(chalk.yellow(`  Percent:  ${a.percentage}%`));
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showSubjects() {
    console.log(chalk.cyan('\n=== Subjects ==='));
    const spinner = ora('Fetching subjects...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/subjects', { sessionId: this.sessionId });
      spinner.succeed('Subjects loaded');
      
      r.subjects.forEach(s => {
        console.log(`  [${s.id}] ${s.code} - ${s.name}`);
      });
      
      return r.subjects;
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      return [];
    }
  }

  async showAllAttendance() {
    console.log(chalk.cyan('\n=== All Subjects Attendance ==='));
    const spinner = ora('Fetching all attendance...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/attendance/all', { sessionId: this.sessionId });
      spinner.succeed('All attendance loaded');
      
      console.log(chalk.yellow(`\n  OVERALL: ${r.overall.classesAttended}/${r.overall.totalClasses} (${r.overall.percentage}%)\n`));
      
      r.subjects.forEach(s => {
        const color = s.percentage >= 75 ? chalk.green : s.percentage >= 50 ? chalk.yellow : chalk.red;
        console.log(color(`  ${s.code.padEnd(12)} ${s.classesAttended}/${s.totalClasses}\t${s.percentage}%\t${s.name}`));
      });
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showTimetable() {
    console.log(chalk.cyan('\n=== Timetable ==='));
    const spinner = ora('Fetching timetable...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/timetable', { sessionId: this.sessionId });
      spinner.succeed('Timetable loaded');
      
      r.timetable.forEach(day => {
        console.log(chalk.yellow(`\n  ${day.day}:`));
        day.periods.forEach(p => {
          if (p.type === 'lunch') {
            console.log(chalk.gray(`    ${p.time} -- LUNCH`));
          } else if (p.type === 'free') {
            console.log(chalk.gray(`    ${p.time} -- Free`));
          } else {
            const sus = p.isSuspended ? ' [SUSPENDED]' : '';
            console.log(`    ${p.time} -- ${p.subject} (${p.code}) [${p.classType}]${sus}`);
          }
        });
      });
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showLastVisit() {
    console.log(chalk.cyan('\n=== Last Visit ==='));
    const spinner = ora('Fetching last visit...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/last-visit', { sessionId: this.sessionId });
      spinner.succeed('Last visit loaded');
      
      const v = r.lastVisit;
      console.log(`  ${v.greeting}, ${v.name}`);
      console.log(`  Last visit: ${v.lastVisitTime}`);
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showSubjectAttendance() {
    const subjects = await this.showSubjects();
    if (subjects.length === 0) return;
    
    const { subjectId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'subjectId',
        message: 'Enter subject ID:',
        validate: input => input.length > 0 || 'Subject ID is required'
      }
    ]);
    
    console.log(chalk.cyan('\n=== Subject Attendance ==='));
    const spinner = ora('Fetching subject attendance...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/attendance/subject', {
        sessionId: this.sessionId,
        subjectId: subjectId
      });
      spinner.succeed('Subject attendance loaded');
      
      const att = r.attendance;
      console.log(`  Total:   ${att.totalClasses}`);
      console.log(`  Present: ${att.classesAttended}`);
      console.log(`  Absent:  ${att.classesAbsent}`);
      console.log(`  Percent: ${att.percentage}%`);
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showToday() {
    console.log(chalk.cyan('\n=== Today\'s Timetable + Attendance ==='));
    const spinner = ora('Fetching today\'s schedule...').start();
    
    try {
      const r = await this.callAPI('POST', '/api/today', { sessionId: this.sessionId });
      spinner.succeed('Today\'s schedule loaded');
      
      console.log(chalk.yellow(`  Day: ${r.day}  |  Date: ${r.date}`));
      if (r.message) console.log(chalk.gray(`  ${r.message}`));
      console.log('');
      
      r.periods.forEach(p => {
        if (p.type === 'lunch') {
          console.log(chalk.gray(`    ${p.time} -- LUNCH`));
        } else if (p.type === 'free') {
          console.log(chalk.gray(`    ${p.time} -- Free`));
        } else {
          const colorMap = {
            'present': chalk.green,
            'absent': chalk.red,
            'suspended': chalk.yellow
          };
          const color = colorMap[p.attendanceStatus] || chalk.white;
          const tag = p.attendanceStatus.toUpperCase();
          const sus = p.isSuspended ? ' [SUSPENDED]' : '';
          console.log(color(`    ${p.time} -- ${p.subject} (${p.code}) [${p.classType}] [${tag}]${sus}`));
        }
      });
      
      const s = r.summary;
      console.log(chalk.cyan(`\n    Summary: ${s.totalPeriods} classes | Present: ${s.present} | Absent: ${s.absent} | Not Marked: ${s.notMarked}`));
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
    }
  }

  async showMenu() {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Choose an option:',
        choices: [
          { name: '📋 Profile', value: '1' },
          { name: '📊 Dashboard', value: '2' },
          { name: '📈 Overall Attendance', value: '3' },
          { name: '📚 Subjects List', value: '4' },
          { name: '📊 All Subjects with Attendance', value: '5' },
          { name: '🗓️  Timetable', value: '6' },
          { name: '🕐 Last Visit', value: '7' },
          { name: '📖 Subject-wise Attendance', value: '8' },
          { name: '📅 Today\'s Timetable + Attendance', value: '9' },
          { name: '🚪 Exit', value: '0' }
        ]
      }
    ]);

    return choice;
  }

  async run() {
    console.log(chalk.bold.cyan('\n╔════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║        AITM ERP CLI - v1.0.0       ║'));
    console.log(chalk.bold.cyan('╚════════════════════════════════════╝\n'));

    await this.healthCheck();
    await this.login();

    let running = true;
    while (running) {
      const choice = await this.showMenu();

      switch (choice) {
        case '1':
          await this.showProfile();
          break;
        case '2':
          await this.showDashboard();
          break;
        case '3':
          await this.showAttendance();
          break;
        case '4':
          await this.showSubjects();
          break;
        case '5':
          await this.showAllAttendance();
          break;
        case '6':
          await this.showTimetable();
          break;
        case '7':
          await this.showLastVisit();
          break;
        case '8':
          await this.showSubjectAttendance();
          break;
        case '9':
          await this.showToday();
          break;
        case '0':
          console.log(chalk.cyan('\nClosing session...'));
          try {
            await this.callAPI('POST', '/api/close-session', { sessionId: this.sessionId });
          } catch (e) {
            // Ignore errors on close
          }
          console.log(chalk.green('Goodbye! 👋\n'));
          running = false;
          break;
      }

      if (running) {
        await inquirer.prompt([
          {
            type: 'input',
            name: 'continue',
            message: 'Press Enter to continue...'
          }
        ]);
      }
    }
  }
}

// Main execution
if (require.main === module) {
  const client = new ERPClient();
  client.run().catch(error => {
    console.error(chalk.red(`\nFatal error: ${error.message}`));
    process.exit(1);
  });
}

module.exports = ERPClient;
