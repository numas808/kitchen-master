import { useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SessionLikes } from '../types';

export default function Match() {
  const navigate = useNavigate();
  const [sessionLikes] = useLocalStorage<SessionLikes>('km_session_likes', { recipeIds: [] });

  const likedRecipes = recipes.filter(r => sessionLikes.recipeIds.includes(r.id));

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white shadow-sm px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">❤️ 気になったレシピ</h1>
      </div>

      <div className="p-5">
        {likedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-6xl">😢</div>
            <p className="text-gray-500 text-lg">まだいいねしたレシピがありません</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-orange-500 transition"
            >
              スワイプする
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">
              {likedRecipes.length}件のレシピをいいねしました。作るレシピを選んでください！
            </p>
            <div className="grid grid-cols-2 gap-4">
              {likedRecipes.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                  className="bg-white rounded-2xl shadow-md overflow-hidden text-left hover:shadow-lg transition active:scale-95"
                >
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm">{recipe.name}</h3>
                    <span className="text-xs text-gray-500">🕐 {recipe.cookingTime}分</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full mt-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 transition"
            >
              もう一度スワイプ
            </button>
          </>
        )}
      </div>
    </div>
  );
}
