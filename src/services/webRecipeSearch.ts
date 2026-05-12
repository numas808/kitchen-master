import type { WebRecipeResult } from '../types';

interface BackendSearchResponse {
  items?: WebRecipeResult[];
  error?: string;
}

export function isWebSearchConfigured(): boolean {
  return true;
}

export async function searchRecipesFromWeb(query: string): Promise<WebRecipeResult[]> {
  const url = new URL('/api/web-recipe-search', window.location.origin);
  url.searchParams.set('query', query);

  const response = await fetch(url.toString());
  const data: BackendSearchResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `検索APIエラー (${response.status})`);
  }

  return data.items ?? [];
}
