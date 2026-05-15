import { useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { useFavorites } from '../hooks/useFavorites';
import { useRecipeHistory } from '../hooks/useRecipeHistory';
import { useStock } from '../hooks/useStock';
import { generateTodaysRecipe } from '../services/todaysRecipe';
import type { TodaysRecipeResult, TodaysRecipeSearchContext } from '../types';

function formatDate(value: string): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center">
      <p className="text-sm font-bold text-gray-700">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{message}</p>
    </div>
  );
}

export default function RecipeHub() {
  const { favorites, removeFavorite } = useFavorites();
  const { history, removeHistory } = useRecipeHistory();
  const [stockItems] = useStock();
  const [requestText, setRequestText] = useState('今日は15〜20分で、あたたかくて満足感のあるごはんが食べたい');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<TodaysRecipeResult | null>(null);
  const [searchContext, setSearchContext] = useState<TodaysRecipeSearchContext | null>(null);

  const fridgeItems = useMemo(() => stockItems.filter((item) => item.location === 'fridge'), [stockItems]);

  const handleGenerate = async () => {
    const trimmed = requestText.trim();
    if (!trimmed) {
      return;
    }

    if (stockItems.length === 0) {
      setGenerateError('先に STOCK HUB で在庫を登録してください。');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await generateTodaysRecipe({
        requestText: trimmed,
        stockItems,
      });

      setRecipe(response.recipe ?? null);
      setSearchContext(response.searchContext ?? null);
    } catch (caught) {
      setRecipe(null);
      setSearchContext(null);
      setGenerateError(caught instanceof Error ? caught.message : '今日の献立生成に失敗しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f0e7] pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-5 shadow-[0_8px_22px_rgba(101,75,49,0.12)]">
          <h1 className="text-3xl font-black tracking-[0.12em] text-[#7a5c3e]">RECIPE HUB</h1>
          <p className="mt-2 text-sm text-[#7b6a5a]">AI提案、お気に入り、履歴をまとめて管理できます。</p>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_22px_rgba(101,75,49,0.12)]">
          <p className="text-xs font-bold tracking-[0.2em] text-[#7a5c3e]">RECIPE HUB AI</p>
          <h2 className="mt-1 text-lg font-bold text-[#3f3328]">今日の献立を提案</h2>
          <p className="mt-2 text-sm text-[#7b6a5a]">食べたい気分と在庫をもとに、今日作りやすいレシピを提案します。</p>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_22px_rgba(101,75,49,0.12)] space-y-3">
          <h3 className="text-base font-bold text-[#3f3328]">今日の食べたいもの</h3>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            rows={4}
            placeholder="例: 今日はさっぱりした魚料理がいい、20分以内、あたたかいものがいい"
            className="w-full rounded-2xl border border-[#ddc9b1] bg-[#fffdf9] px-4 py-3 text-sm focus:border-[#b89168] focus:outline-none"
          />

          <div className="rounded-2xl bg-[#f7ecdf] p-3">
            <p className="text-xs font-bold text-[#7b6a5a]">冷蔵庫の在庫</p>
            {fridgeItems.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">冷蔵庫在庫がまだありません</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {fridgeItems.map((item) => (
                  <span key={item.id} className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-bold text-[#5f4f40]">
                    {item.name} / {item.expiryDate || '未設定'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {generateError && <p className="text-sm text-red-500">{generateError}</p>}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || requestText.trim().length === 0}
            className="w-full rounded-full bg-[#b89168] px-4 py-3 text-sm font-bold text-[#fff8ed] transition hover:bg-[#a27d56] disabled:bg-gray-300"
          >
            {isGenerating ? '献立を生成中...' : '今日の献立を作る'}
          </button>
        </div>

        {searchContext && (
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_20px_rgba(101,75,49,0.1)]">
            <h3 className="text-base font-bold text-[#3f3328]">検索コンテキスト</h3>
            <p className="mt-2 text-sm text-[#5f4f40]">検索語: {searchContext.searchQuery}</p>
            <p className="mt-1 text-sm text-[#5f4f40]">調理方針: {searchContext.cookingStyle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {searchContext.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-[#f0dfc8] px-3 py-1 text-xs font-bold text-[#6b543d]">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {recipe && (
          <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_20px_rgba(101,75,49,0.1)]">
            <div className="space-y-4">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 rounded-2xl p-2 transition hover:bg-[#f7ecdf]"
              >
                <img src={recipe.imageUrl} alt={recipe.title} className="h-20 w-20 rounded-xl object-cover bg-gray-100" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#7a5c3e]">RECIPE HUB</p>
                  <h3 className="mt-1 truncate text-lg font-bold text-[#3f3328]">{recipe.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[#7b6a5a]">{recipe.description}</p>
                </div>
              </a>

              {recipe.reasons.length > 0 && (
                <div className="rounded-2xl bg-[#f3e6d6] p-3">
                  <p className="mb-2 text-xs font-bold text-[#7a5c3e]">選定理由</p>
                  <ul className="space-y-1 text-sm text-[#5f4f40]">
                    {recipe.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.ingredients.length > 0 && (
                <div className="rounded-2xl bg-[#f4eadb] p-3">
                  <p className="mb-2 text-xs font-bold text-[#7a5c3e]">材料</p>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={`${ing}-${i}`} className="flex items-start gap-1 text-xs text-[#5f4f40]">
                        <span className="mt-0.5 flex-shrink-0 text-[#b89168]">•</span>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.steps.length > 0 && (
                <div className="rounded-xl bg-[#f8efe3] p-3">
                  <p className="mb-2 text-xs font-bold text-[#6b543d]">作り方</p>
                  <ol className="space-y-2">
                    {recipe.steps.map((step, i) => (
                      <li key={`${step}-${i}`} className="flex gap-2 text-xs text-[#5f4f40]">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#b89168] text-[10px] font-bold text-[#fff8ed]">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_20px_rgba(101,75,49,0.1)]">
          <h2 className="text-base font-bold text-[#3f3328]">お気に入りレシピ</h2>
          <p className="mt-1 text-xs text-[#7b6a5a]">保存したレシピをここで一覧できます。</p>

          <div className="mt-4 space-y-3">
            {favorites.length === 0 ? (
              <EmptyState
                title="まだお気に入りがありません"
                message="レシピをお気に入りに追加すると、ここに表示されます。"
              />
            ) : (
              favorites.map((item) => (
                 <div key={item.id} className="rounded-2xl border border-[#efe5d8] bg-[#fdf6ea] p-3">
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex gap-3">
                    <img src={item.imageUrl} alt={item.title} className="h-20 w-20 rounded-xl object-cover bg-gray-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                           <h3 className="truncate text-sm font-bold text-[#3f3328]">{item.title}</h3>
                           <p className="mt-1 line-clamp-2 text-xs text-[#7b6a5a]">{item.description}</p>
                         </div>
                         <span className="shrink-0 rounded-full bg-[#f0dfc8] px-2 py-1 text-[11px] font-bold text-[#7a5c3e]">
                           {formatDate(item.favoritedAt)}
                         </span>
                      </div>
                    </div>
                  </a>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => removeFavorite(item.id)}
                       className="rounded-full bg-[#efe3d3] px-3 py-2 text-xs font-bold text-[#6b543d]"
                     >
                      解除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_20px_rgba(101,75,49,0.1)]">
          <h2 className="text-base font-bold text-[#3f3328]">レシピ履歴</h2>
          <p className="mt-1 text-xs text-[#7b6a5a]">見たレシピを新しい順に表示します。</p>

          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <EmptyState
                title="まだ履歴がありません"
                message="レシピを検索すると、最近見たものがここに並びます。"
              />
            ) : (
              history.map((item) => (
                 <div key={`${item.id}-${item.viewedAt}`} className="rounded-2xl border border-[#efe5d8] bg-[#fdf6ea] p-3">
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex gap-3">
                    <img src={item.imageUrl} alt={item.title} className="h-20 w-20 rounded-xl object-cover bg-gray-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                           <h3 className="truncate text-sm font-bold text-[#3f3328]">{item.title}</h3>
                           <p className="mt-1 line-clamp-2 text-xs text-[#7b6a5a]">{item.description}</p>
                         </div>
                         <span className="shrink-0 rounded-full bg-[#efe3d3] px-2 py-1 text-[11px] font-bold text-[#7b6a5a]">
                           {formatDate(item.viewedAt)}
                         </span>
                      </div>
                    </div>
                  </a>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => removeHistory(item.id)}
                       className="rounded-full bg-[#efe3d3] px-3 py-2 text-xs font-bold text-[#6b543d]"
                     >
                      解除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
