const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const open = require('open');
const { ERPClient, saveSession } = require('../api/erpClient');
const { palette } = require('../ui/palette');
const { profileTable } = require('../ui/table');
const { box } = require('../ui/box');

async function doLogin(client, opts = {}) {
  const credentials = opts.rollNo && opts.password
    ? { username: opts.rollNo, password: opts.password }
    : await inquirer.prompt([
        { type: 'input', name: 'username', message: 'Enter your roll number:', validate: (i) => i.length > 0 || 'Roll number is required' },
        { type: 'password', name: 'password', message: 'Enter your password:', mask: '*', validate: (i) => i.length > 0 || 'Password is required' }
      ]);

  const spinner = ora('Getting CAPTCHA...').start();
  let captchaResp;
  try {
    captchaResp = await client.login(credentials);
  } catch (e) {
    spinner.fail(palette.error(`Error: ${e.message}`));
    throw e;
  }
  spinner.succeed(palette.success(`Session: ${client.sessionId}`));

  const imgData = captchaResp.captchaImage.replace(/^data:image\/png;base64,/, '');
  const imgBuffer = Buffer.from(imgData, 'base64');
  const imgPath = path.join(process.cwd(), 'captcha.png');
  fs.writeFileSync(imgPath, imgBuffer);

  let shownInTerminal = false;
  const isWindows = process.platform === 'win32';
  if (!isWindows) {
    try {
      const terminalImage = (await import('terminal-image')).default;
      console.log(palette.info('\n--- CAPTCHA (enter the characters you see below) ---\n'));
      console.log(await terminalImage.buffer(imgBuffer, { width: '50%' }));
      console.log(palette.info('\n--- Enter the CAPTCHA above ---\n'));
      shownInTerminal = true;
    } catch {
      /* fall through to file fallback */
    }
  }
  if (!shownInTerminal) {
    console.log(palette.info('\n--- CAPTCHA (enter the characters you see in the image) ---\n'));
    console.log(palette.warn(`CAPTCHA saved to: ${imgPath}`));
    if (isWindows) {
      console.log(palette.warn('Open it with: start captcha.png'));
    }
    console.log(palette.info('\n--- Enter the CAPTCHA above ---\n'));
    try { await open(imgPath); } catch {}
  }

  let loggedIn = false;
  while (!loggedIn) {
    const { captcha } = await inquirer.prompt([{
      type: 'input',
      name: 'captcha',
      message: shownInTerminal ? 'Enter the CAPTCHA you see above:' : 'Enter the CAPTCHA you see:',
      validate: (i) => i.length > 0 || 'CAPTCHA is required'
    }]);

    const loginSpinner = ora('Submitting CAPTCHA...').start();
    try {
      const loginResp = await client.submitCaptcha(captcha);
      if (loginResp.success === true || loginResp.success === 'true') {
        loginSpinner.succeed(palette.success('Login successful!'));
        loggedIn = true;
        const student = loginResp.student;
        console.log(await box(
          `Name: ${student.name}\nCRN: ${student.crn}\nRoll No: ${student.rollNo}\nProgram: ${student.program}\nBranch: ${student.branch}\nSemester: ${student.semester}`,
          { borderColor: 'green' }
        ));
        saveSession(client.sessionId, student);
        return { success: true, student };
      }
    } catch (e) {
      loginSpinner.fail(palette.error(`Login failed: ${e.message}`));
    }

    try {
      const refreshResp = await client.refreshCaptcha();
      const newImgData = refreshResp.captchaImage.replace(/^data:image\/png;base64,/, '');
      const newImgBuffer = Buffer.from(newImgData, 'base64');
      fs.writeFileSync(imgPath, newImgBuffer);
      if (!isWindows) {
        try {
          const terminalImage = (await import('terminal-image')).default;
          console.log(palette.info('\n--- New CAPTCHA ---\n'));
          console.log(await terminalImage.buffer(newImgBuffer, { width: '50%' }));
          console.log(palette.info('\n--- Enter the CAPTCHA above ---\n'));
          shownInTerminal = true;
        } catch { /* fall through */ }
      }
      if (!shownInTerminal) {
        console.log(palette.info('\n--- New CAPTCHA ---\n'));
        console.log(palette.warn(`CAPTCHA saved to: ${imgPath}`));
        if (isWindows) console.log(palette.warn('Open it with: start captcha.png'));
        console.log(palette.info('\n--- Enter the CAPTCHA above ---\n'));
        try { await open(imgPath); } catch {}
      }
    } catch (refreshError) {
      throw refreshError;
    }
  }
}

module.exports = { doLogin };
