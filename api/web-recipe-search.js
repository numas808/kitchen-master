import {
  sendJson,
  ensureAuthorized,
  getProviderConfigError,
  searchByTavily,
  searchByGoogleCustomSearch,
  searchByCookpad,
  scrapeRecipePage,
} from './_utils.js';

export default async function handler(req, res) {
  if (!ensureAuthorized(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const query = (url.searchParams.get('query') || '').trim();

  if (!query) {
    sendJson(res, 400, { error: 'query は必須です。' });
    return;
  }

  const configError = getProviderConfigError();
  if (configError) {
    sendJson(res, 500, { error: configError });
    return;
  }

  const provider = process.env.SEARCH_PROVIDER || 'cookpad';

  try {
    let result;
    if (provider === 'google') {
      result = await searchByGoogleCustomSearch(query);
    } else if (provider === 'tavily') {
      result = await searchByTavily(query);
    } else {
      result = await searchByCookpad(query);
    }

    if (!result.ok) {
      sendJson(res, result.status, { error: result.error, provider });
      return;
    }

    const top = result.items[0];
    if (!top) {
      sendJson(res, 200, { items: [], provider });
      return;
    }

    const scraped = await scrapeRecipePage(top.sourceUrl);
    const enriched = {
      ...top,
      ingredients: scraped.ingredients,
      steps: scraped.steps,
      parseStatus: scraped.parseStatus,
      imageUrl: scraped.imageUrl || top.imageUrl,
    };

    sendJson(res, 200, { items: [enriched], provider });
  } catch (error) {
    sendJson(res, 500, { error: '検索処理に失敗しました。' });
  }
}
