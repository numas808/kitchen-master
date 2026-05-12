import { useCallback, useEffect, useState } from 'react';
import type { WebRecipeHistoryEntry, WebRecipeResult } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { fetchSharedData, updateSharedData } from '../services/sharedData';

const STORAGE_KEY = 'km_web_recipe_history';

export function useRecipeHistory() {
  const [history, setHistory] = useLocalStorage<WebRecipeHistoryEntry[]>(STORAGE_KEY, []);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const shared = await fetchSharedData();
        if (!active) {
          return;
        }

        if (Array.isArray(shared.history)) {
          setHistory(shared.history);
        }
      } catch {
        // keep local cache fallback
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [setHistory]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    updateSharedData({ history }).catch(() => {
      // keep local cache even if server sync fails
    });
  }, [history, isHydrated]);

  const recordRecipeView = useCallback((recipe: WebRecipeResult) => {
    setHistory((prev) => {
      const next: WebRecipeHistoryEntry[] = [
        {
          ...recipe,
          viewedAt: new Date().toISOString(),
        },
        ...prev.filter((entry) => entry.id !== recipe.id),
      ];

      return next.slice(0, 20);
    });
  }, [setHistory]);

  const removeHistory = useCallback(
    (recipeId: string) => {
      setHistory((prev) => prev.filter((entry) => entry.id !== recipeId));
    },
    [setHistory]
  );

  return { history, recordRecipeView, removeHistory };
}
