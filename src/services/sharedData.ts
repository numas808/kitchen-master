import type { StockItem, WebRecipeFavorite, WebRecipeHistoryEntry } from '../types';

export interface SharedDataPayload {
  stockItems: StockItem[];
  favorites: WebRecipeFavorite[];
  history: WebRecipeHistoryEntry[];
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function fetchSharedData(): Promise<SharedDataPayload> {
  const response = await fetch('/api/shared-data');
  const data = await readJson<Partial<SharedDataPayload>>(response);

  if (!response.ok) {
    throw new Error('共有データの取得に失敗しました。');
  }

  return {
    stockItems: Array.isArray(data.stockItems) ? data.stockItems : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    history: Array.isArray(data.history) ? data.history : [],
  };
}

export async function updateSharedData(patch: Partial<SharedDataPayload>): Promise<void> {
  const response = await fetch('/api/shared-data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error('共有データの保存に失敗しました。');
  }
}
