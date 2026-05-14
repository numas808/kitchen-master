import { readFile, writeFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';

const SEARCH_PROVIDER = (process.env.SEARCH_PROVIDER || 'tavily').toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || process.env.VITE_GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX || process.env.VITE_GOOGLE_SEARCH_CX;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD || '';
const APP_DB_FILE = new URL('../app-db.json', import.meta.url);
const ACCESS_COOKIE_NAME = 'km_access';

const EMPTY_APP_DB = {
  stockItems: [],
  favorites: [],
  history: [],
};

const SUPABASE_TABLE = 'shared_data';
const SUPABASE_ROW_ID = 'shared-data';
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const supabase = useSupabase
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function loadAppDb() {
  if (supabase) {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select('payload')
      .eq('id', SUPABASE_ROW_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data?.payload && typeof data.payload === 'object') {
      return {
        stockItems: asArray(data.payload.stockItems),
        favorites: asArray(data.payload.favorites),
        history: asArray(data.payload.history),
      };
    }

    return { ...EMPTY_APP_DB };
  }

  try {
    const raw = await readFile(APP_DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      stockItems: asArray(parsed.stockItems),
      favorites: asArray(parsed.favorites),
      history: asArray(parsed.history),
    };
  } catch {
    return { ...EMPTY_APP_DB };
  }
}

async function saveAppDb(nextDb) {
  const payload = {
    stockItems: asArray(nextDb.stockItems),
    favorites: asArray(nextDb.favorites),
    history: asArray(nextDb.history),
  };

  if (supabase) {
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .upsert(
        {
          id: SUPABASE_ROW_ID,
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    if (error) {
      throw error;
    }

    return payload;
  }

  await writeFile(APP_DB_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
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
        // ignore JSON parse errors
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

export {
  loadAppDb,
  saveAppDb,
  sendJson,
  ensureAuthorized,
  isAuthorizedRequest,
  isAccessProtectionEnabled,
  setAccessCookie,
  clearAccessCookie,
  verifyAccessPassword,
  readRequestBody,
  getProviderConfigError,
  getTodaysRecipeConfigError,
  normalizeTodaysStockItems,
  normalizeTodaysSearchContext,
  buildTodaysRecipeSearchContext,
  chooseTodaysRecipe,
  scrapeRecipePage,
  searchByTavily,
  searchByGoogleCustomSearch,
};
