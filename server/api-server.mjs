import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const PORT = Number(process.env.API_PORT || 8787);
const SEARCH_PROVIDER = (process.env.SEARCH_PROVIDER || 'tavily').toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || process.env.VITE_GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX || process.env.VITE_GOOGLE_SEARCH_CX;
const APP_ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD || '';
const APP_DB_FILE = new URL('./app-db.json', import.meta.url);
const ACCESS_COOKIE_NAME = 'km_access';

const EMPTY_APP_DB = {
  stockItems: [],
  favorites: [],
  history: [],
};

let appDbCache = null;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function loadAppDb() {
  if (appDbCache) {
    return appDbCache;
  }

  try {
    const raw = await readFile(APP_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    appDbCache = {
      stockItems: asArray(parsed.stockItems),
      favorites: asArray(parsed.favorites),
      history: asArray(parsed.history),
    };
  } catch {
    appDbCache = { ...EMPTY_APP_DB };
    await writeFile(APP_DB_FILE, `${JSON.stringify(appDbCache, null, 2)}\n`, 'utf8');
  }

  return appDbCache;
}

async function saveAppDb(nextDb) {
  appDbCache = {
    stockItems: asArray(nextDb.stockItems),
    favorites: asArray(nextDb.favorites),
    history: asArray(nextDb.history),
  };

  await writeFile(APP_DB_FILE, `${JSON.stringify(appDbCache, null, 2)}\n`, 'utf8');
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

function hashValue(value) {
  return createHash('sha256').update(value).digest('hex');
}

function isSameToken(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function parseCookies(req) {
  const rawCookie = req.headers.cookie || '';

  return rawCookie.split(';').reduce((cookies, entry) => {
    const [name, ...rest] = entry.trim().split('=');
    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(rest.join('='));
    return cookies;
  }, {});
}

function isAccessProtectionEnabled() {
  return APP_ACCESS_PASSWORD.trim().length > 0;
}

function getExpectedAccessToken() {
  return hashValue(APP_ACCESS_PASSWORD.trim());
}

function isAuthorizedRequest(req) {
  if (!isAccessProtectionEnabled()) {
    return true;
  }

  const cookies = parseCookies(req);
  return isSameToken(cookies[ACCESS_COOKIE_NAME], getExpectedAccessToken());
}

function ensureAuthorized(req, res) {
  if (isAuthorizedRequest(req)) {
    return true;
  }

  sendJson(res, 401, {
    error: 'アクセスパスワードが必要です。',
    code: 'AUTH_REQUIRED',
  });
  return false;
}

function setAccessCookie(res) {
  const parts = [
    `${ACCESS_COOKIE_NAME}=${encodeURIComponent(getExpectedAccessToken())}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=604800',
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAccessCookie(res) {
  const parts = [
    `${ACCESS_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function verifyAccessPassword(password) {
  if (!isAccessProtectionEnabled()) {
    return true;
  }

  return isSameToken(hashValue(String(password || '').trim()), getExpectedAccessToken());
}

function normalizeItem(item, index) {
  const imageUrl =
    item?.pagemap?.cse_image?.[0]?.src ||
    item?.pagemap?.metatags?.[0]?.['og:image'] ||
    `https://picsum.photos/seed/web${index}/400/300`;

  return {
    id: `web-${index}-${item.link}`,
    title: item.title || 'タイトル不明',
    description: item.snippet || '',
    imageUrl,
    sourceUrl: item.link || '',
  };
}

function normalizeTavilyItem(item, index) {
  const imageUrl =
    item?.images?.[0]?.url ||
    item?.image_url ||
    `https://picsum.photos/seed/tavily${index}/400/300`;

  return {
    id: `web-tavily-${index}-${item.url || item.title || index}`,
    title: item.title || 'タイトル不明',
    description: item.content || '',
    imageUrl,
    sourceUrl: item.url || '',
    ingredients: [],
    steps: [],
    parseStatus: 'failed',
  };
}

function extractJsonBlock(value) {
  if (typeof value !== 'string') {
    throw new Error('OpenAI response is not a string');
  }

  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

function getOpenAIConfigError() {
  if (!OPENAI_API_KEY) {
    return 'OPENAI_API_KEY が未設定です。';
  }

  return null;
}

async function callOpenAIJson(messages, systemPrompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const upstreamMessage = typeof data?.error?.message === 'string' ? data.error.message : '';
    const isAuthError =
      response.status === 401 || /incorrect api key|invalid api key|api key/i.test(upstreamMessage);

    if (isAuthError) {
      throw new Error('OpenAI API の認証に失敗しました。サーバー側の環境変数を確認してください。');
    }

    throw new Error(`OpenAI API error (${response.status})`);
  }

  const content = data?.choices?.[0]?.message?.content;
  const jsonText = extractJsonBlock(content);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`OpenAI JSON parse failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

function normalizeTodaysStockItems(stockItems) {
  return Array.isArray(stockItems)
    ? stockItems
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          name: String(item.name || '').trim(),
          location: item.location === 'freezer' ? 'freezer' : 'fridge',
          category: item.category === 'drink' || item.category === 'vegetable' ? item.category : 'food',
          expiryDate: typeof item.expiryDate === 'string' ? item.expiryDate : '',
          note: typeof item.note === 'string' ? item.note : '',
        }))
        .filter((item) => item.name)
    : [];
}

function normalizeTodaysSearchContext(rawContext, stockItems, requestText) {
  const availableNames = stockItems.map((item) => item.name).filter(Boolean);
  const rawFocusIngredients = Array.isArray(rawContext?.focusIngredients) ? rawContext.focusIngredients : [];
  const focusIngredients = rawFocusIngredients.filter((name) => availableNames.includes(name));

  const searchQuery =
    typeof rawContext?.searchQuery === 'string' && rawContext.searchQuery.trim()
      ? rawContext.searchQuery.trim()
      : `${requestText} ${availableNames.slice(0, 3).join(' ')}`.trim();

  return {
    searchQuery,
    keywords: Array.isArray(rawContext?.keywords)
      ? rawContext.keywords.map((keyword) => String(keyword).trim()).filter(Boolean).slice(0, 8)
      : [],
    focusIngredients: focusIngredients.length > 0 ? focusIngredients.slice(0, 5) : availableNames.slice(0, 5),
    cookingStyle:
      typeof rawContext?.cookingStyle === 'string' && rawContext.cookingStyle.trim()
        ? rawContext.cookingStyle.trim()
        : '時短',
  };
}

function extractInstructionText(inst) {
  if (typeof inst === 'string') return inst.trim();
  if (inst && typeof inst === 'object') {
    if (inst.text) return String(inst.text).trim();
    if (inst.name) return String(inst.name).trim();
    if (Array.isArray(inst.itemListElement)) {
      return inst.itemListElement.map(extractInstructionText).filter(Boolean).join(' ');
    }
  }
  return '';
}

async function scrapeRecipePage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { ingredients: [], steps: [], parseStatus: 'failed', imageUrl: null };

    const html = await res.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // JSON-LD 優先
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent || '');
        const nodes = Array.isArray(raw) ? raw : [raw, ...(raw['@graph'] || [])];
        for (const node of nodes) {
          if (!node) continue;
          const type = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
          if (!type.includes('Recipe')) continue;

          const domIngredients = (node.recipeIngredient || []).map((s) => String(s).trim()).filter(Boolean);

          const NOISE_PATTERN = /instagram|twitter|youtube|facebook|チャンネル登録|フォロー|レシピID|YAHOO|掲載|ブログ|https?:/i;
          const domSteps = (node.recipeInstructions || [])
            .map(extractInstructionText)
            .filter((s) => s && !NOISE_PATTERN.test(s));

          const imageUrl =
            (Array.isArray(node.image) ? node.image[0] : node.image)?.url ||
            (Array.isArray(node.image) ? node.image[0] : node.image) ||
            null;

          if (domIngredients.length > 0 || domSteps.length > 0) {
            return {
              ingredients: domIngredients,
              steps: domSteps,
              parseStatus: domIngredients.length > 0 && domSteps.length > 0 ? 'ok' : 'partial',
              imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
            };
          }
        }
      } catch {
        // JSONパース失敗は無視
      }
    }

    return { ingredients: [], steps: [], parseStatus: 'failed', imageUrl: null };
  } catch {
    return { ingredients: [], steps: [], parseStatus: 'failed', imageUrl: null };
  }
}

async function buildTodaysRecipeSearchContext(requestText, stockItems) {
  const stockLines = normalizeTodaysStockItems(stockItems);
  const prompt = {
    requestText: requestText.trim(),
    fridgeStock: stockLines,
  };

  return callOpenAIJson(
    [
      {
        role: 'user',
        content:
          '以下のJSONを受け取り、今日の献立検索に使うための検索語を日本語で整形してください。必ずJSONで返してください。\n' +
          JSON.stringify(prompt),
      },
    ],
    [
      'あなたは献立検索用のクエリ作成アシスタントです。',
      '目的は、ユーザーの食べたいものと冷蔵庫の在庫から、検索エンジンに投げるための短い検索語を作ることです。',
      '出力はJSONのみで、次の形にしてください。',
      '{"searchQuery":"...","keywords":["..."],"focusIngredients":["..."],"cookingStyle":"..."}',
      'searchQuery は 1 つの短い検索語にしてください。レシピ、食材、調理時間のキーワードを含めても構いません。',
      'keywords は 3〜8 個の重要キーワードにしてください。',
      'focusIngredients は 冷蔵庫在庫の中で特に活用したい食材を短く列挙してください。',
      'cookingStyle は ひとことで調理方針を表してください。',
    ].join('\n'),
  );
}

async function chooseTodaysRecipe(searchContext, serpResults, requestText, stockItems) {
  const prompt = {
    requestText: requestText.trim(),
    fridgeStock: normalizeTodaysStockItems(stockItems),
    searchContext,
    searchResults: serpResults.map((item, index) => ({
      index,
      title: item.title,
      description: item.description,
      sourceUrl: item.sourceUrl,
    })),
  };

  return callOpenAIJson(
    [
      {
        role: 'user',
        content:
          '以下の検索結果から、今日の献立に最適な1件を選び、理由とレシピの下書きをJSONで返してください。\n' +
          JSON.stringify(prompt),
      },
    ],
    [
      'あなたは料理レシピ選定アシスタントです。',
      'ユーザーの希望、冷蔵庫の在庫、検索結果を見て最適な1件を選んでください。',
      '出力はJSONのみで、次の形にしてください。',
      '{"selectedIndex":0,"reasons":["..."],"recipe":{"title":"...","description":"...","ingredients":["..."],"steps":["..."]}}',
      'selectedIndex は searchResults の index を使ってください。',
      'reasons は 3 件までの短い理由にしてください。',
      'recipe.ingredients と recipe.steps は、後で実ページのスクレイピング結果で上書きされることがあるため、簡潔で自然な下書きで構いません。',
    ].join('\n'),
  );
}

function getProviderConfigError() {
  if (SEARCH_PROVIDER === 'tavily') {
    if (!TAVILY_API_KEY) {
      return 'TAVILY_API_KEY が未設定です。';
    }
    return null;
  }

  if (SEARCH_PROVIDER === 'google') {
    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      return 'GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_CX が未設定です。';
    }
    return null;
  }

  return `未対応の SEARCH_PROVIDER です: ${SEARCH_PROVIDER}`;
}

function getTodaysRecipeConfigError() {
  return getOpenAIConfigError();
}

async function searchByTavily(query) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TAVILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `${query} レシピ`,
      topic: 'general',
      search_depth: 'basic',
      max_results: 8,
      include_images: true,
      include_image_descriptions: false,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.detail || data?.error || `Tavily APIエラー (${response.status})`,
      items: [],
    };
  }

  return {
    ok: true,
    status: 200,
    error: null,
    items: (data.results || []).slice(0, 8).map(normalizeTavilyItem),
  };
}

async function searchByGoogleCustomSearch(query) {
  const target = new URL('https://www.googleapis.com/customsearch/v1');
  target.searchParams.set('key', GOOGLE_API_KEY);
  target.searchParams.set('cx', GOOGLE_CX);
  target.searchParams.set('q', `${query} レシピ`);
  target.searchParams.set('num', '8');
  target.searchParams.set('lr', 'lang_ja');
  target.searchParams.set('gl', 'jp');

  const response = await fetch(target.toString());
  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.error?.message || `検索APIエラー (${response.status})`,
      items: [],
    };
  }

  return {
    ok: true,
    status: 200,
    error: null,
    items: (data.items || []).map(normalizeItem),
  };
}

async function handleWebRecipeSearch(req, res) {
  if (!ensureAuthorized(req, res)) {
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
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

  try {
    const result =
      SEARCH_PROVIDER === 'google'
        ? await searchByGoogleCustomSearch(query)
        : await searchByTavily(query);

    if (!result.ok) {
      sendJson(res, result.status, {
        error: result.error,
        provider: SEARCH_PROVIDER,
      });
      return;
    }

    // 上位1件のみ返す＋スクレイピング
    const top = result.items[0];
    if (!top) {
      sendJson(res, 200, { items: [], provider: SEARCH_PROVIDER });
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

    sendJson(res, 200, { items: [enriched], provider: SEARCH_PROVIDER });
  } catch {
    sendJson(res, 500, { error: '検索処理に失敗しました。' });
  }
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleTodaysRecipe(req, res) {
  if (!ensureAuthorized(req, res)) {
    return;
  }

  const configError = getTodaysRecipeConfigError();
  if (configError) {
    sendJson(res, 500, { error: configError });
    return;
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch {
    sendJson(res, 400, { error: 'JSON body の読み込みに失敗しました。' });
    return;
  }

  const requestText = typeof body?.requestText === 'string' ? body.requestText.trim() : '';
  const stockItems = normalizeTodaysStockItems(body?.stockItems);

  if (!requestText) {
    sendJson(res, 400, { error: 'requestText は必須です。' });
    return;
  }

  if (stockItems.length === 0) {
    sendJson(res, 400, { error: 'stockItems は1件以上必要です。' });
    return;
  }

  try {
    const fridgeStockItems = stockItems.filter((item) => item.location === 'fridge');
    const contextStockItems = fridgeStockItems.length > 0 ? fridgeStockItems : stockItems;

    const searchContext = normalizeTodaysSearchContext(
      await buildTodaysRecipeSearchContext(requestText, contextStockItems),
      contextStockItems,
      requestText,
    );
    const searchResult = await searchByTavily(searchContext.searchQuery || requestText);

    if (!searchResult.ok) {
      sendJson(res, searchResult.status, {
        error: searchResult.error,
        provider: 'tavily',
      });
      return;
    }

    const selectedResults = searchResult.items.slice(0, 5);
    const recipeChoice = await chooseTodaysRecipe(searchContext, selectedResults, requestText, contextStockItems);
    const selectedIndex = Number.isInteger(recipeChoice?.selectedIndex) ? recipeChoice.selectedIndex : 0;
    const selectedItem = selectedResults[Math.max(0, Math.min(selectedIndex, selectedResults.length - 1))] || selectedResults[0];

    if (!selectedItem) {
      sendJson(res, 200, { error: '候補レシピが見つかりませんでした。', items: [], provider: 'tavily' });
      return;
    }

    const scraped = await scrapeRecipePage(selectedItem.sourceUrl);
    const fallbackRecipe = recipeChoice?.recipe || {};
    const ingredients = scraped.ingredients.length > 0 ? scraped.ingredients : Array.isArray(fallbackRecipe.ingredients) ? fallbackRecipe.ingredients : [];
    const steps = scraped.steps.length > 0 ? scraped.steps : Array.isArray(fallbackRecipe.steps) ? fallbackRecipe.steps : [];

    const finalRecipe = {
      id: selectedItem.id,
      title: fallbackRecipe.title || selectedItem.title,
      description: fallbackRecipe.description || selectedItem.description,
      imageUrl: scraped.imageUrl || selectedItem.imageUrl,
      sourceUrl: selectedItem.sourceUrl,
      ingredients,
      steps,
      parseStatus: scraped.parseStatus === 'failed' && (ingredients.length === 0 || steps.length === 0) ? 'failed' : scraped.parseStatus,
      searchQuery: searchContext.searchQuery,
      reasons: Array.isArray(recipeChoice?.reasons) ? recipeChoice.reasons : [],
      focusIngredients: Array.isArray(searchContext.focusIngredients) ? searchContext.focusIngredients : [],
    };

    sendJson(res, 200, {
      provider: 'openai+tavily',
      searchContext,
      results: selectedResults,
      recipe: finalRecipe,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : '今日の献立生成に失敗しました。',
    });
  }
}

async function handleSharedDataGet(res) {
  try {
    const appDb = await loadAppDb();
    sendJson(res, 200, appDb);
  } catch {
    sendJson(res, 500, { error: '共有データの読み込みに失敗しました。' });
  }
}

async function handleSharedDataPut(req, res) {
  if (!ensureAuthorized(req, res)) {
    return;
  }

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

    await saveAppDb(nextDb);

    sendJson(res, 200, {
      ok: true,
      updatedAt: new Date().toISOString(),
      ...nextDb,
    });
  } catch {
    sendJson(res, 500, { error: '共有データの保存に失敗しました。' });
  }
}

async function handleAccessSession(req, res) {
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

const server = createServer((req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: 'invalid request' });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/health')) {
    const configError = getProviderConfigError();
    sendJson(res, 200, {
      ok: true,
      provider: SEARCH_PROVIDER,
      ready: !configError,
      configError,
      hasOpenAiKey: Boolean(OPENAI_API_KEY),
      hasTavilyApiKey: Boolean(TAVILY_API_KEY),
      hasGoogleKey: Boolean(GOOGLE_API_KEY),
      hasGoogleCx: Boolean(GOOGLE_CX),
    });
    return;
  }

  if (req.url.startsWith('/api/access/session')) {
    handleAccessSession(req, res);
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/todays-recipe')) {
    handleTodaysRecipe(req, res);
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/shared-data')) {
    if (!ensureAuthorized(req, res)) {
      return;
    }

    handleSharedDataGet(res);
    return;
  }

  if (req.method === 'PUT' && req.url.startsWith('/api/shared-data')) {
    handleSharedDataPut(req, res);
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/web-recipe-search')) {
    handleWebRecipeSearch(req, res);
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
