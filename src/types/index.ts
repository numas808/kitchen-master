export interface Recipe {
  id: string;
  name: string;
  image: string;
  cookingTime: number;
  difficulty: 'easy' | 'normal';
  category: ('meat' | 'fish' | 'vegetable' | 'egg' | 'noodle' | 'rice')[];
  ingredients: { name: string; amount: string }[];
  steps: string[];
  tags: string[];
}

export interface UserSettings {
  foodPreferences: string[];
  ngIngredients: string[];
  maxCookingTime: number;
}

export interface SwipeHistory {
  recipeId: string;
  action: 'like' | 'dislike';
  date: string;
}

export interface SessionLikes {
  recipeIds: string[];
}
