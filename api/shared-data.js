import { sendJson, readRequestBody, loadAppDb, saveAppDb, ensureAuthorized } from './_utils.js';

export default async function handler(req, res) {
  if (!ensureAuthorized(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const appDb = await loadAppDb();
      sendJson(res, 200, appDb);
    } catch {
      sendJson(res, 500, { error: '共有データの読み込みに失敗しました。' });
    }
    return;
  }

  if (req.method === 'PUT') {
    let body;
    try {
      body = await readRequestBody(req);
    } catch {
      sendJson(res, 400, { error: 'JSON body の読み込みに失敗しました。' });
      return;
    }

    if (body.stockItems !== undefined && !Array.isArray(body.stockItems)) {
      sendJson(res, 400, { error: 'stockItems は配列で指定してください。' });
      return;
    }

    if (body.favorites !== undefined && !Array.isArray(body.favorites)) {
      sendJson(res, 400, { error: 'favorites は配列で指定してください。' });
      return;
    }

    if (body.history !== undefined && !Array.isArray(body.history)) {
      sendJson(res, 400, { error: 'history は配列で指定してください。' });
      return;
    }

    try {
      const current = await loadAppDb();
      const nextDb = {
        stockItems: body.stockItems ?? current.stockItems,
        favorites: body.favorites ?? current.favorites,
        history: body.history ?? current.history,
      };

      const updated = await saveAppDb(nextDb);
      sendJson(res, 200, {
        ok: true,
        updatedAt: new Date().toISOString(),
        ...updated,
      });
    } catch {
      sendJson(res, 500, { error: '共有データの保存に失敗しました。' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
