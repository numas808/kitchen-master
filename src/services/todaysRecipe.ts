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

  const data: TodaysRecipeApiResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `今日の献立APIエラー (${response.status})`);
  }

  return data;
}