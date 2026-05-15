import type { StockItem, TodaysRecipeResult, TodaysRecipeSearchContext } from '../types';

interface TodaysRecipeApiResponse {
  provider?: string;
  searchContext?: TodaysRecipeSearchContext;
  results?: Array<{ title: string; description: string; sourceUrl: string; imageUrl: string }>;
  recipe?: TodaysRecipeResult;
  error?: string;
}

export interface TodaysRecipeRequestPayload {
  requestText: string;
  stockItems: StockItem[];
}

export async function generateTodaysRecipe(payload: TodaysRecipeRequestPayload) {
  const response = await fetch('/api/todays-recipe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data: TodaysRecipeApiResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error(response.ok ? '今日の献立APIの応答形式が不正です。' : `今日の献立APIエラー (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error ?? `今日の献立APIエラー (${response.status})`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.recipe) {
    throw new Error('候補レシピが見つかりませんでした。条件を変えて再度お試しください。');
  }

  return data;
}
