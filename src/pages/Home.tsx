import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useStock } from '../hooks/useStock';
import { generateTodaysRecipe } from '../services/todaysRecipe';
import type { TodaysRecipeResult } from '../types';

// ---------- SVG Icons ----------

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// Category chip icons
function AllIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.34a1 1 0 0 0 1.38 1.39C8 19 9.63 17.5 13 16" />
      <path d="M22 2c0 0-7.64 2.64-13 8 0 0 1.5 3.5 6 4 4 .46 7-4 7-12z" />
    </svg>
  );
}

function UtensilsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

function RiceBowlIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C6.477 22 2 17.523 2 12h20c0 5.523-4.477 10-10 10z" />
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10" />
      <path d="M9 8c0-1.657 1.343-3 3-3s3 1.343 3 3" />
    </svg>
  );
}

function FridgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="9" y1="6" x2="9" y2="8" />
      <line x1="9" y1="14" x2="9" y2="18" />
    </svg>
  );
}

// ---------- Filters ----------

const FILTERS = [
  { id: 'all', label: 'すべて', icon: <AllIcon />, text: '' },
  { id: 'quick', label: '時短', icon: <ClockIcon />, text: '10分以内でできるレシピ' },
  { id: 'healthy', label: 'ヘルシー', icon: <LeafIcon />, text: 'カロリー控えめでヘルシーなレシピ' },
  { id: 'hearty', label: 'がっつり', icon: <UtensilsIcon />, text: 'ボリューム満点のレシピ' },
  { id: 'japanese', label: '和食', icon: <RiceBowlIcon />, text: '和食のレシピ' },
] as const;

const DEFAULT_TEXT = '今日は15〜20分で、あたたかくて満足感のあるごはんが食べたい';

// ---------- RecipeCard ----------

function RecipeCard({ recipe }: { recipe: TodaysRecipeResult }) {
  const [showReasons, setShowReasons] = useState(false);

  let hostname: string;
  try {
    hostname = new URL(recipe.sourceUrl).hostname;
  } catch {
    hostname = recipe.sourceUrl;
  }

  const displayIngredients = recipe.ingredients.slice(0, 3);
  const extraCount = recipe.ingredients.length - displayIngredients.length;

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 space-y-3" data-swipeable>
      {/* Title & description */}
      <div>
        <h3 className="text-xl font-bold text-[#3D2B1F]">{recipe.title}</h3>
        <p className="mt-1 text-sm text-[#A09080] line-clamp-1">{recipe.description}</p>
      </div>

      {/* Ingredient chips */}
      {recipe.ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayIngredients.map((ing, i) => (
            <span key={`${ing}-${i}`} className="rounded-full bg-[#FFF0E0] px-2.5 py-0.5 text-xs text-[#3D2B1F]">
              {ing}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-[#A09080]">+{extraCount}</span>
          )}
        </div>
      )}

      {/* Reasons toggle */}
      {recipe.reasons.length > 0 && (
        <div>
          <button
            onClick={() => setShowReasons((p) => !p)}
            className="text-xs text-[#1A5C4A] font-bold flex items-center gap-1"
          >
            理由を見る {showReasons ? '▲' : '▼'}
          </button>
          {showReasons && (
            <div className="mt-2 rounded-xl bg-[#F0FBF7] p-3">
              <ul className="space-y-1 text-xs text-[#3D2B1F]">
                {recipe.reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <hr className="border-gray-100" />

      {/* Thumbnail + source link */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.open(recipe.sourceUrl, '_blank')}
          className="flex-shrink-0"
          aria-label="レシピ元を見る"
        >
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-16 h-16 rounded-full object-cover bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-[#A09080] truncate">🔗 {hostname}</p>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => window.open(recipe.sourceUrl, '_blank')}
        className="w-full rounded-full bg-[#1A5C4A] py-3 text-sm font-bold text-white"
      >
        このレシピを見る →
      </button>
    </div>
  );
}

// ---------- Main component ----------

export default function Home() {
  const navigate = useNavigate();
  const [stockItems] = useStock();
  const [requestText, setRequestText] = useState(DEFAULT_TEXT);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<TodaysRecipeResult | null>(null);

  const handleFilterSelect = (filterId: string, filterText: string) => {
    setSelectedFilter(filterId);
    setRequestText(filterId === 'all' ? DEFAULT_TEXT : filterText);
  };

  const handleGenerate = async () => {
    const trimmed = requestText.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await generateTodaysRecipe({ requestText: trimmed, stockItems });
      setRecipe(response.recipe ?? null);
    } catch (caught) {
      setRecipe(null);
      setGenerateError(caught instanceof Error ? caught.message : '今日の献立生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EF] pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        {/* B. Title area */}
        <div>
          <h1 className="text-2xl font-black text-[#1A5C4A]">今日どうする？</h1>
          <p className="mt-1 text-sm text-[#A09080]">あなたにぴったりのレシピを提案します</p>
        </div>

        {/* C. Text input */}
        <div className="rounded-full bg-[#FFF0E0] flex items-center px-4 py-3 gap-2">
          <span className="text-[#A09080] flex-shrink-0">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={requestText}
            onChange={(e) => {
              setRequestText(e.target.value);
              setSelectedFilter('all');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="bg-transparent flex-1 text-sm outline-none text-[#3D2B1F] placeholder:text-[#A09080]"
            placeholder="例：10分以内で作れるヘルシーなレシピ"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || requestText.trim().length === 0}
            className="w-9 h-9 rounded-full bg-[#1A5C4A] flex items-center justify-center flex-shrink-0 disabled:bg-gray-300 transition"
            aria-label="レシピを提案する"
          >
            <SendIcon />
          </button>
        </div>

        {/* D. Quick filter chips */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const active = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => handleFilterSelect(f.id, f.text)}
                className={`flex flex-col items-center gap-1 flex-shrink-0 rounded-2xl px-4 py-2.5 border transition ${
                  active
                    ? 'bg-[#1A5C4A] text-white border-[#1A5C4A]'
                    : 'bg-white border-gray-200 text-[#3D2B1F]'
                }`}
              >
                <span className={active ? 'text-white' : 'text-[#3D2B1F]'}>{f.icon}</span>
                <span className="text-xs font-bold whitespace-nowrap">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* E. Recipe section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#3D2B1F]">おすすめレシピ</h2>
            {recipe && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs text-[#1A5C4A] font-bold disabled:opacity-50"
              >
                <RefreshIcon />
                別のレシピを見る
              </button>
            )}
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white shadow-sm py-10 text-[#A09080]">
              <SpinnerIcon />
              <span className="text-sm">献立を生成中...</span>
            </div>
          )}

          {!isGenerating && generateError && (
            <div className="rounded-2xl bg-white shadow-sm p-4 space-y-3">
              <p className="text-sm text-red-500">{generateError}</p>
              <button
                onClick={handleGenerate}
                className="rounded-full border border-[#1A5C4A] px-4 py-2 text-xs font-bold text-[#1A5C4A]"
              >
                再試行
              </button>
            </div>
          )}

          {!isGenerating && !generateError && !recipe && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
              <p className="text-sm font-bold text-[#A09080]">リクエストを入力してAIに提案させましょう</p>
              <p className="mt-1 text-xs text-gray-400">上の入力欄にリクエストを入れて送信してください</p>
            </div>
          )}

          {!isGenerating && !generateError && recipe && (
            <RecipeCard recipe={recipe} />
          )}
        </div>

        {/* F. Fridge banner */}
        <button
          onClick={() => navigate('/stockhub')}
          className="w-full bg-[#FFF0E0] rounded-2xl p-4 flex items-center gap-3 text-left"
        >
          <span className="text-[#1A5C4A]">
            <FridgeIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#3D2B1F]">冷蔵庫をのぞく</p>
            <p className="text-xs text-[#A09080]">ある食材からレシピを提案します</p>
          </div>
          <div className="flex-shrink-0 text-right">
            {stockItems.length > 0 ? (
              <span className="text-xs font-bold text-[#1A5C4A]">食材 {stockItems.length}件 登録済み →</span>
            ) : (
              <span className="text-xs text-[#A09080]">まだ食材が登録されていません</span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

