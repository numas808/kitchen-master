import { useState } from 'react';
import type { WebRecipeResult } from '../types';
import { searchRecipesFromWeb } from '../services/webRecipeSearch';

export function useRecipeSearch() {
  const [results, setResults] = useState<WebRecipeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchRecipesFromWeb(query);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '検索に失敗しました');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setResults([]);
    setSearched(false);
    setError(null);
  };

  return { results, isLoading, error, searched, search, clear };
}
