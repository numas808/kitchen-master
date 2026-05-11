import type { UserSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_SETTINGS: UserSettings = {
  foodPreferences: [],
  ngIngredients: [],
  maxCookingTime: 0,
};

export function useSettings() {
  return useLocalStorage<UserSettings>('km_settings', DEFAULT_SETTINGS);
}
