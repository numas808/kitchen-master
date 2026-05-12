import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { WebRecipeFavorite, WebRecipeResult } from '../types';
import { fetchSharedData, updateSharedData } from '../services/sharedData';

const STORAGE_KEY = 'km_web_favorite_recipes';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<WebRecipeFavorite[]>(STORAGE_KEY, []);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const shared = await fetchSharedData();
        if (!active) {
          return;
        }

        if (Array.isArray(shared.favorites)) {
          setFavorites(shared.favorites);
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
  }, [setFavorites]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    updateSharedData({ favorites }).catch(() => {
      // keep local cache even if server sync fails
    });
  }, [favorites, isHydrated]);

  const isFavorite = useCallback(
    (recipeId: string) => favorites.some((entry) => entry.id === recipeId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (recipe: WebRecipeResult) => {
      setFavorites((prev) => {
        const existing = prev.find((entry) => entry.id === recipe.id);
        if (existing) {
          return prev.filter((entry) => entry.id !== recipe.id);
        }

        return [
          {
            ...recipe,
            favoritedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    },
    [setFavorites]
  );

  const removeFavorite = useCallback(
    (recipeId: string) => {
      setFavorites((prev) => prev.filter((entry) => entry.id !== recipeId));
    },
    [setFavorites]
  );

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
