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
    <div className="min-h-screen bg-[#f6f0e7]">
      <AppHeader />

      <div className="p-5 space-y-6">
        {/* Food preferences */}
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-5 shadow-[0_8px_22px_rgba(101,75,49,0.12)]">
          <h2 className="mb-1 text-lg font-bold text-[#3f3328]">好みの食材</h2>
          <p className="mb-4 text-sm text-[#7b6a5a]">優先して表示される食材カテゴリ</p>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => togglePreference(cat.value)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                  settings.foodPreferences.includes(cat.value)
                    ? 'bg-[#b89168] text-[#fff8ed] shadow-md'
                    : 'bg-[#efe3d3] text-[#6b543d] hover:bg-[#e6d7c3]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* NG ingredients */}
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-5 shadow-[0_8px_22px_rgba(101,75,49,0.12)]">
          <h2 className="mb-1 text-lg font-bold text-[#3f3328]">NGな食材</h2>
          <p className="mb-4 text-sm text-[#7b6a5a]">苦手な食材はスワイプ対象から除外されます</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={ngInput}
              onChange={e => setNgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNgIngredient()}
              placeholder="例：えび、ナッツ"
              className="flex-1 rounded-full border border-[#ddc9b1] bg-[#fffdf9] px-4 py-2 text-sm focus:outline-none focus:border-[#b89168]"
            />
            <button
              onClick={addNgIngredient}
              className="rounded-full bg-[#b89168] px-4 py-2 text-sm font-medium text-[#fff8ed] transition hover:bg-[#a27d56]"
            >
              追加
            </button>
          </div>
          {settings.ngIngredients.length === 0 ? (
            <p className="text-gray-400 text-sm">NGな食材はありません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.ngIngredients.map(ng => (
                <span key={ng} className="flex items-center gap-1 rounded-full bg-[#f0dfc8] px-3 py-1 text-sm text-[#7a5c3e]">
                  {ng}
                  <button
                    onClick={() => removeNgIngredient(ng)}
                    className="ml-1 font-bold text-[#a27d56] hover:text-[#7a5c3e]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cooking time */}
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-5 shadow-[0_8px_22px_rgba(101,75,49,0.12)]">
          <h2 className="mb-1 text-lg font-bold text-[#3f3328]">調理時間</h2>
          <p className="mb-4 text-sm text-[#7b6a5a]">最大調理時間でフィルタリング</p>
          <div className="flex flex-wrap gap-3">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSettings(prev => ({ ...prev, maxCookingTime: opt.value }))}
                className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                  settings.maxCookingTime === opt.value
                    ? 'bg-[#b89168] text-[#fff8ed] shadow-md'
                    : 'bg-[#efe3d3] text-[#6b543d] hover:bg-[#e6d7c3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#9a8875]">設定は自動保存されます</p>
      </div>
    </div>
  );
}
