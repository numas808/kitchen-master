import { useState } from 'react';
import AppHeader from '../components/AppHeader';
import { useSettings } from '../hooks/useSettings';

const CATEGORIES = [
  { value: 'meat', label: '🥩 肉' },
  { value: 'fish', label: '🐟 魚' },
  { value: 'vegetable', label: '🥦 野菜' },
  { value: 'egg', label: '🥚 卵' },
  { value: 'noodle', label: '🍜 麺' },
  { value: 'rice', label: '🍚 ご飯' },
];

const TIME_OPTIONS = [
  { value: 0, label: '無制限' },
  { value: 15, label: '15分以内' },
  { value: 30, label: '30分以内' },
  { value: 60, label: '60分以内' },
];

export default function Settings() {
  const [settings, setSettings] = useSettings();
  const [ngInput, setNgInput] = useState('');

  const togglePreference = (value: string) => {
    setSettings(prev => ({
      ...prev,
      foodPreferences: prev.foodPreferences.includes(value)
        ? prev.foodPreferences.filter(p => p !== value)
        : [...prev.foodPreferences, value],
    }));
  };

  const addNgIngredient = () => {
    const trimmed = ngInput.trim();
    if (trimmed && !settings.ngIngredients.includes(trimmed)) {
      setSettings(prev => ({
        ...prev,
        ngIngredients: [...prev.ngIngredients, trimmed],
      }));
      setNgInput('');
    }
  };

  const removeNgIngredient = (ng: string) => {
    setSettings(prev => ({
      ...prev,
      ngIngredients: prev.ngIngredients.filter(n => n !== ng),
    }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <AppHeader />

      <div className="p-5 space-y-6">
        {/* Food preferences */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-1">好みの食材</h2>
          <p className="text-sm text-gray-500 mb-4">優先して表示される食材カテゴリ</p>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => togglePreference(cat.value)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                  settings.foodPreferences.includes(cat.value)
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* NG ingredients */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-1">NGな食材</h2>
          <p className="text-sm text-gray-500 mb-4">苦手な食材はスワイプ対象から除外されます</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={ngInput}
              onChange={e => setNgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNgIngredient()}
              placeholder="例：えび、ナッツ"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
            <button
              onClick={addNgIngredient}
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-full text-sm font-medium hover:bg-orange-500 transition"
            >
              追加
            </button>
          </div>
          {settings.ngIngredients.length === 0 ? (
            <p className="text-gray-400 text-sm">NGな食材はありません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.ngIngredients.map(ng => (
                <span
                  key={ng}
                  className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm"
                >
                  {ng}
                  <button
                    onClick={() => removeNgIngredient(ng)}
                    className="text-red-400 hover:text-red-600 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cooking time */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-1">調理時間</h2>
          <p className="text-sm text-gray-500 mb-4">最大調理時間でフィルタリング</p>
          <div className="flex flex-wrap gap-3">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSettings(prev => ({ ...prev, maxCookingTime: opt.value }))}
                className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                  settings.maxCookingTime === opt.value
                    ? 'bg-[#FF6B35] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">設定は自動保存されます</p>
      </div>
    </div>
  );
}
