import { useEffect, useState } from 'react';
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
  { id: 'quick', label: '時短', icon: <ClockIcon />, text: '10分以内でできるレシピ' },
  { id: 'healthy', label: 'ヘルシー', icon: <LeafIcon />, text: 'カロリー控えめでヘルシーなレシピ' },
  { id: 'hearty', label: 'がっつり', icon: <UtensilsIcon />, text: 'ボリューム満点のレシピ' },
  { id: 'japanese', label: '和食', icon: <RiceBowlIcon />, text: '和食のレシピ' },
] as const;

const DEFAULT_QUERY = 'さっぱりしたものが食べたい';

// ---------- RecipeCard ----------

function RecipeCard({ recipe, variant }: { recipe: TodaysRecipeResult; variant: number }) {
  const [showReasons, setShowReasons] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accentColors = ['#FFCBD8', '#C8F0CA', '#FFE8A8'];
  const accent = accentColors[variant % accentColors.length];
  const tagLabel = variant === 0 ? 'おすすめ' : '別の候補';

  let hostname: string;
  try {
    hostname = new URL(recipe.sourceUrl).hostname;
  } catch {
    hostname = recipe.sourceUrl;
  }

  const displayIngredients = recipe.ingredients.slice(0, 3);
  const extraCount = recipe.ingredients.length - displayIngredients.length;

  return (
    <div
      className={`rounded-2xl bg-white shadow-sm p-6 space-y-5 transition-all duration-300 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ borderLeft: `6px solid ${accent}` }}
      data-swipeable
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-black">{recipe.title}</h3>
          <p className="mt-2 text-sm text-[#595959] line-clamp-2">{recipe.description}</p>
        </div>
        <span className="inline-flex rounded-full bg-[rgba(141,212,159,0.18)] px-3 py-1 text-xs font-semibold text-[#1A5C3F]">
          {tagLabel}
        </span>
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
            className="text-xs text-black font-bold flex items-center gap-1"
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
        className="w-full rounded-full bg-[#F28A1D] py-4 text-base font-semibold text-white"
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
  const [requestText, setRequestText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('quick');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<TodaysRecipeResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handleGenerate = async () => {
    const trimmed = requestText.trim();
    const selectedFilterText = FILTERS.find((item) => item.id === selectedFilter)?.text ?? '';
    const query = trimmed || selectedFilterText || DEFAULT_QUERY;
    if (!query) return;

    setHasSearched(true);
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await generateTodaysRecipe({ requestText: query, stockItems });
      setRecipe(response.recipe ?? null);
    } catch (caught) {
      setRecipe(null);
      setGenerateError(caught instanceof Error ? caught.message : '今日の献立生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        {/* B. Title area */}
        <div>
          <h1 className="text-2xl font-black text-black">今日どうする？</h1>
        </div>

        {/* C. Text input */}
        <div className="rounded-full bg-[#FFF2E5] flex items-center px-4 py-3 gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8F8F92] shadow-sm">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={requestText}
            onChange={(e) => {
              setRequestText(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="bg-transparent flex-1 text-sm font-medium text-[#1A1A1A] outline-none placeholder:text-[#8F8F92]"
            placeholder="さっぱりしたものが食べたい"
          />
        </div>

        {/* D. Quick filter chips */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const active = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => handleFilterSelect(f.id)}
                className={`flex flex-col items-center gap-2 flex-shrink-0 rounded-full px-4 py-3 border transition ${
                  active
                    ? 'bg-[#F28A1D] text-white border-[#F28A1D]'
                    : 'bg-white border-gray-200 text-black'
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-white/10 text-white' : 'bg-[#F4F4F6] text-black'}`}>
                  {f.icon}
                </span>
                <span className="text-xs font-bold whitespace-nowrap">{f.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full rounded-2xl bg-[#F28A1D] py-4 text-sm font-semibold text-white transition disabled:bg-gray-200 disabled:text-gray-500 flex items-center justify-center gap-2"
        >
          <SendIcon />
          レシピを提案する
        </button>

        {/* E. Recipe section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-black">おすすめレシピ</h2>
            {recipe && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1 text-xs text-black font-bold disabled:opacity-50"
              >
                <RefreshIcon />
                別のレシピを見る
              </button>
            )}
          </div>

          {isGenerating && hasSearched && (
            <div className="rounded-2xl bg-white shadow-sm p-4 text-sm text-[#8F8F92] flex items-center justify-center gap-2">
              <SpinnerIcon />
              検索中...
            </div>
          )}

          {!isGenerating && generateError && (
            <div className="rounded-2xl bg-white shadow-sm p-4 space-y-3">
              <p className="text-sm text-red-500">{generateError}</p>
              <button
                onClick={handleGenerate}
                className="rounded-full border border-[#F28A1D] px-4 py-2 text-xs font-bold text-[#F28A1D]"
              >
                再試行
              </button>
            </div>
          )}

          {!isGenerating && !generateError && !recipe && hasSearched && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
              <p className="text-sm font-bold text-[#A09080]">リクエストを入力してAIに提案させましょう</p>
              <p className="mt-1 text-xs text-gray-400">上の入力欄にリクエストを入れて送信してください</p>
            </div>
          )}

          {!isGenerating && !generateError && recipe && (
            <div className="space-y-5">
              {[0, 1].map((variant) => (
                <RecipeCard key={variant} recipe={recipe} variant={variant} />
              ))}
            </div>
          )}
        </div>

        {/* F. Fridge banner */}
        <button
          onClick={() => navigate('/stockhub')}
          className="w-full bg-[#FCE8D3] rounded-2xl p-4 flex items-center gap-3 text-left"
        >
          <span className="text-[#F28A1D]">
            <FridgeIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black">冷蔵庫をのぞく</p>
          </div>
          <div className="flex-shrink-0 text-right">
            {stockItems.length > 0 ? (
              <span className="text-xs font-bold text-black">食材 {stockItems.length}件 登録済み →</span>
            ) : (
              <span className="text-xs text-[#A09080]">まだ食材が登録されていません</span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

