import {
  sendJson,
  readRequestBody,
  isAuthorizedRequest,
  isAccessProtectionEnabled,
  setAccessCookie,
  clearAccessCookie,
  verifyAccessPassword,
} from '../_utils.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    sendJson(res, 200, {
      authenticated: isAuthorizedRequest(req),
      protectionEnabled: isAccessProtectionEnabled(),
    });
    return;
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await readRequestBody(req);
    } catch {
      sendJson(res, 400, { error: 'JSON body の読み込みに失敗しました。' });
      return;
    }

    const password = typeof body?.password === 'string' ? body.password : '';

    if (!verifyAccessPassword(password)) {
      clearAccessCookie(res);
      sendJson(res, 401, { error: 'パスワードが正しくありません。' });
      return;
    }

    setAccessCookie(res);
    sendJson(res, 200, {
      ok: true,
      authenticated: true,
      protectionEnabled: isAccessProtectionEnabled(),
    });
    return;
  }

  if (req.method === 'DELETE') {
    clearAccessCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
