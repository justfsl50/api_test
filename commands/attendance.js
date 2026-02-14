const { loadSession } = require('../api/erpClient');
const { doLogin } = require('./login');

async function ensureSession(client) {
  const session = loadSession();
  if (session?.sessionId) {
    client.sessionId = session.sessionId;
    return true;
  }
  await doLogin(client);
  return true;
}

module.exports = { ensureSession };
