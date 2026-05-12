import { useEffect } from 'react';
import type { UserSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_SETTINGS: UserSettings = {
  foodPreferences: [],
  ngIngredients: [],
  maxCookingTime: 0,
};

const LEGACY_STORAGE_KEY = 'km_settings';

export function useSettings() {
  const storageKey = LEGACY_STORAGE_KEY;
  const [settings, setSettings] = useLocalStorage<UserSettings>(storageKey, DEFAULT_SETTINGS);

  useEffect(() => {
    if (window.localStorage.getItem(storageKey) !== null) {
      return;
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) {
      return;
    }

    try {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === 'object') {
        setSettings(parsed as UserSettings);
      }
    } catch {
      // ignore legacy parse failure
    }
  }, [setSettings, storageKey]);

  return [settings, setSettings] as const;
}
