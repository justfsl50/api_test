const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://erptestbackend-production.up.railway.app';

const getStateDir = () => {
  const os = require('os');
  const home = os.homedir ? os.homedir() : (process.env.HOME || process.env.USERPROFILE || process.cwd());
  return path.join(home, '.aitm-erp');
};

const getSessionPath = () => path.join(getStateDir(), 'session.json');

const loadSession = () => {
  try {
    const data = fs.readFileSync(getSessionPath(), 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const saveSession = (sessionId, student) => {
  const dir = getStateDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getSessionPath(), JSON.stringify({ sessionId, student, savedAt: Date.now() }, null, 2));
};

const clearSession = () => {
  try {
    if (fs.existsSync(getSessionPath())) fs.unlinkSync(getSessionPath());
  } catch {}
};

class ERPClient {
  constructor(options = {}) {
    this.sessionId = options.sessionId || null;
    this.baseUrl = options.baseUrl || BASE_URL;
    this.timeout = options.timeout || 30000;
  }

  async callAPI(method, endpoint, data = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      if (method === 'GET') {
        const response = await axios.get(url, { timeout: this.timeout });
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
    try {
      const health = await this.callAPI('GET', '/health');
      return { ok: true, health };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async login(credentials) {
    const captchaResp = await this.callAPI('POST', '/api/get-captcha', credentials);
    this.sessionId = captchaResp.sessionId;
    return captchaResp;
  }

  async submitCaptcha(captcha) {
    return this.callAPI('POST', '/api/submit-captcha', {
      sessionId: this.sessionId,
      captcha
    });
  }

  async refreshCaptcha() {
    return this.callAPI('POST', '/api/refresh-captcha', { sessionId: this.sessionId });
  }

  async closeSession() {
    if (!this.sessionId) return;
    try {
      await this.callAPI('POST', '/api/close-session', { sessionId: this.sessionId });
    } catch {}
    this.sessionId = null;
  }

  async getProfile() {
    return this.callAPI('POST', '/api/profile', { sessionId: this.sessionId });
  }

  async getDashboard() {
    return this.callAPI('POST', '/api/dashboard', { sessionId: this.sessionId });
  }

  async getAttendance() {
    return this.callAPI('POST', '/api/attendance', { sessionId: this.sessionId });
  }

  async getAllAttendance() {
    return this.callAPI('POST', '/api/attendance/all', { sessionId: this.sessionId });
  }

  async getSubjects() {
    return this.callAPI('POST', '/api/subjects', { sessionId: this.sessionId });
  }

  async getTimetable() {
    return this.callAPI('POST', '/api/timetable', { sessionId: this.sessionId });
  }

  async getLastVisit() {
    return this.callAPI('POST', '/api/last-visit', { sessionId: this.sessionId });
  }

  async getSubjectAttendance(subjectId) {
    return this.callAPI('POST', '/api/attendance/subject', {
      sessionId: this.sessionId,
      subjectId
    });
  }

  async getToday() {
    return this.callAPI('POST', '/api/today', { sessionId: this.sessionId });
  }
}

module.exports = { ERPClient, loadSession, saveSession, clearSession, getSessionPath, getStateDir, BASE_URL };
