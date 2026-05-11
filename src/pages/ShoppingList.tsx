import { useParams, useNavigate } from 'react-router-dom';
import { recipes } from '../data/recipes';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function ShoppingList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = recipes.find(r => r.id === id);
  const [checked, setChecked] = useLocalStorage<string[]>(`km_shopping_${id}`, []);

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">レシピが見つかりません</p>
      </div>
    );
  }

  const toggleItem = (name: string) => {
    setChecked(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const allChecked = checked.length === recipe.ingredients.length;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white shadow-sm px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">🛒 買い物リスト</h1>
          <p className="text-sm text-gray-500">{recipe.name}</p>
        </div>
      </div>

      <div className="p-5">
        {allChecked && (
          <div className="bg-green-100 text-green-700 rounded-xl p-4 mb-4 text-center font-bold">
            🎉 全部揃いました！
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {recipe.ingredients.map((ing, i) => (
            <button
              key={i}
              onClick={() => toggleItem(ing.name)}
              className={`w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 text-left transition ${
                checked.includes(ing.name) ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                checked.includes(ing.name)
                  ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                  : 'border-gray-300'
              }`}>
                {checked.includes(ing.name) && '✓'}
              </div>
              <div className="flex-1">
                <span className={`font-medium ${checked.includes(ing.name) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {ing.name}
                </span>
              </div>
              <span className="text-gray-500 text-sm">{ing.amount}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          {checked.length} / {recipe.ingredients.length} 完了
        </p>

        <button
          onClick={() => setChecked([])}
          className="w-full mt-4 py-3 bg-gray-100 text-gray-600 font-medium rounded-full hover:bg-gray-200 transition"
        >
          リセット
        </button>
      </div>
    </div>
  );
}
