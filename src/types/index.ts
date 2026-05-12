export interface UserSettings {
  foodPreferences: string[];
  ngIngredients: string[];
  maxCookingTime: number;
}

export type StockLocation = 'fridge' | 'freezer';

export type StockCategory = 'drink' | 'food' | 'vegetable';

export interface StockItem {
  id: string;
  name: string;
  location: StockLocation;
  category: StockCategory;
  purchaseDate: string;
  expiryDate: string;
  note: string;
  createdAt: string;
}

export interface WebRecipeResult {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  ingredients: string[];
  steps: string[];
  parseStatus: 'ok' | 'partial' | 'failed';
}

export interface WebRecipeHistoryEntry extends WebRecipeResult {
  viewedAt: string;
}

export interface WebRecipeFavorite extends WebRecipeResult {
  favoritedAt: string;
}

export interface TodaysRecipeStockItem {
  name: string;
  location: StockLocation;
  category: StockCategory;
  expiryDate: string;
  note: string;
}

export interface TodaysRecipeSearchContext {
  searchQuery: string;
  keywords: string[];
  focusIngredients: string[];
  cookingStyle: string;
}

export interface TodaysRecipeResult extends WebRecipeResult {
  searchQuery: string;
  reasons: string[];
  focusIngredients: string[];
}
