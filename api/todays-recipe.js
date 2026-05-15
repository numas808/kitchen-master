import {
  sendJson,
  ensureAuthorized,
  readRequestBody,
  getTodaysRecipeConfigError,
  normalizeTodaysStockItems,
  normalizeTodaysSearchContext,
  buildTodaysRecipeSearchContext,
  chooseTodaysRecipe,
  searchByCookpad,
  scrapeRecipePage,
} from './_utils.js';

export default async function handler(req, res) {
  if (!ensureAuthorized(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
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
    const searchResult = await searchByCookpad(searchContext.searchQuery || requestText);

    if (!searchResult.ok) {
      sendJson(res, searchResult.status, {
        error: searchResult.error,
        provider: 'cookpad',
      });
      return;
    }

    const selectedResults = searchResult.items.slice(0, 5);
    const recipeChoice = await chooseTodaysRecipe(searchContext, selectedResults, requestText, contextStockItems);
    const selectedIndex = Number.isInteger(recipeChoice?.selectedIndex) ? recipeChoice.selectedIndex : 0;
    const selectedItem = selectedResults[Math.max(0, Math.min(selectedIndex, selectedResults.length - 1))] || selectedResults[0];

    if (!selectedItem) {
      sendJson(res, 200, { error: '候補レシピが見つかりませんでした。', items: [], provider: 'cookpad' });
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
      provider: 'openai+cookpad',
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
