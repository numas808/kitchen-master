import { useParams, useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">レシピが見つかりません</p>
        <button onClick={() => navigate('/')} className="text-[#FF6B35]">ホームに戻る</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-24">
      {/* Hero image */}
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-64 object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white bg-opacity-90 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow-md text-xl"
        >
          ←
        </button>
      </div>

      <div className="p-5">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">{recipe.name}</h1>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap mb-6">
          <span className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">
            🕐 {recipe.cookingTime}分
          </span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            recipe.difficulty === 'easy'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {recipe.difficulty === 'easy' ? '⭐ 簡単' : '⭐⭐ 普通'}
          </span>
          {recipe.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🛒 材料</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between text-gray-700 border-b border-gray-50 pb-2 last:border-0">
                <span>{ing.name}</span>
                <span className="text-gray-500 font-medium">{ing.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3">📝 作り方</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-[#FF6B35] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-[430px] mx-auto">
          <button
            onClick={() => navigate(`/shopping/${recipe.id}`)}
            className="w-full py-4 bg-[#FF6B35] text-white font-bold rounded-2xl text-lg hover:bg-orange-500 transition shadow-lg active:scale-95"
          >
            🛒 買い物リストを作る
          </button>
        </div>
      </div>
    </div>
  );
}
