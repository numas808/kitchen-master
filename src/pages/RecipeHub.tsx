import AppHeader from '../components/AppHeader';
import { useFavorites } from '../hooks/useFavorites';
import { useRecipeHistory } from '../hooks/useRecipeHistory';

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

  return (
    <div className="min-h-screen bg-[#FFF8EF] pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black tracking-[0.12em] text-[#1A5C4A]">MY RECIPES</h1>
          <p className="mt-2 text-sm text-[#A09080]">お気に入りと閲覧履歴をまとめて管理できます。</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-base font-bold text-[#3D2B1F]">お気に入りレシピ</h2>
          <p className="mt-1 text-xs text-[#A09080]">保存したレシピをここで一覧できます。</p>

          <div className="mt-4 space-y-3">
            {favorites.length === 0 ? (
              <EmptyState
                title="まだお気に入りがありません"
                message="レシピをお気に入りに追加すると、ここに表示されます。"
              />
            ) : (
              favorites.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-100 bg-[#FCFCFB] p-3">
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex gap-3">
                    <img src={item.imageUrl} alt={item.title} className="h-20 w-20 rounded-xl object-cover bg-gray-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[#3D2B1F]">{item.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-[#A09080]">{item.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#FFF0E0] px-2 py-1 text-[11px] font-bold text-[#1A5C4A]">
                          {formatDate(item.favoritedAt)}
                        </span>
                      </div>
                    </div>
                  </a>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="rounded-full bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600"
                    >
                      解除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-base font-bold text-[#3D2B1F]">レシピ履歴</h2>
          <p className="mt-1 text-xs text-[#A09080]">見たレシピを新しい順に表示します。</p>

          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <EmptyState
                title="まだ履歴がありません"
                message="レシピを検索すると、最近見たものがここに並びます。"
              />
            ) : (
              history.map((item) => (
                <div key={`${item.id}-${item.viewedAt}`} className="rounded-2xl border border-gray-100 bg-[#FCFCFB] p-3">
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex gap-3">
                    <img src={item.imageUrl} alt={item.title} className="h-20 w-20 rounded-xl object-cover bg-gray-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[#3D2B1F]">{item.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-[#A09080]">{item.description}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500">
                          {formatDate(item.viewedAt)}
                        </span>
                      </div>
                    </div>
                  </a>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => removeHistory(item.id)}
                      className="rounded-full bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600"
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