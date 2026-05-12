import { useMemo, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { useStock } from '../hooks/useStock';
import type { StockCategory, StockItem, StockLocation } from '../types';

type StockFormState = {
  name: string;
  location: StockLocation;
  category: StockCategory;
  purchaseDate: string;
  expiryDate: string;
  note: string;
};

const locationLabels: Record<StockLocation, string> = {
  fridge: '冷蔵庫',
  freezer: '冷凍庫',
};

const categoryLabels: Record<StockCategory, string> = {
  drink: '飲料',
  food: '食品',
  vegetable: '野菜',
};

const initialFormState: StockFormState = {
  name: '',
  location: 'fridge',
  category: 'food',
  purchaseDate: '',
  expiryDate: '',
  note: '',
};

function isExpired(expiryDate: string): boolean {
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(expiryDate) < today;
}

function expiresSoon(expiryDate: string): boolean {
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - today.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  return days >= 0 && days <= 3;
}

function formatStockText(items: StockItem[]): string {
  const now = new Date();
  const lines = [
    'キッチンマスター 在庫一覧',
    `出力日時: ${now.toLocaleString('ja-JP')}`,
    `件数: ${items.length}`,
    '',
  ];

  (['fridge', 'freezer'] as const).forEach((location) => {
    lines.push(`[${locationLabels[location]}]`);

    const groupedItems = items.filter((item) => item.location === location);
    if (groupedItems.length === 0) {
      lines.push('登録なし', '');
      return;
    }

    groupedItems.forEach((item) => {
      lines.push(
        `- ${item.name}`,
        `  種類: ${categoryLabels[item.category]}`,
        `  購入日: ${item.purchaseDate || '未設定'}`,
        `  期限: ${item.expiryDate || '未設定'}`,
        `  メモ: ${item.note || 'なし'}`
      );
    });

    lines.push('');
  });

  return lines.join('\n');
}

function downloadTextFile(content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `kitchen-stock-${today}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Stock() {
  const [stockItems, setStockItems] = useStock();
  const [form, setForm] = useState<StockFormState>(initialFormState);

  const groupedItems = useMemo(() => {
    const sorted = [...stockItems].sort((left, right) => {
      const leftDate = left.expiryDate || '9999-12-31';
      const rightDate = right.expiryDate || '9999-12-31';

      if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate);
      }

      return right.createdAt.localeCompare(left.createdAt);
    });

    return {
      fridge: sorted.filter((item) => item.location === 'fridge'),
      freezer: sorted.filter((item) => item.location === 'freezer'),
    };
  }, [stockItems]);

  const addStockItem = () => {
    const name = form.name.trim();
    if (!name) {
      return;
    }

    const item: StockItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      location: form.location,
      category: form.category,
      purchaseDate: form.purchaseDate,
      expiryDate: form.expiryDate,
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
    };

    setStockItems((prev) => [item, ...prev]);
    setForm(initialFormState);
  };

  const removeStockItem = (id: string) => {
    setStockItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExport = () => {
    downloadTextFile(formatStockText(stockItems));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black tracking-[0.12em] text-[#1F6B5B]">STOCK HUB</h1>
          <p className="mt-2 text-sm text-gray-500">食材の在庫、期限、メモをまとめて管理できます。</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">在庫を登録</h2>
            <p className="text-xs text-gray-500 mt-1">所在地、種類、購入日、期限を付けて管理します。</p>
          </div>

          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="品名を入力"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35]"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">所在地</span>
                <select
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value as StockLocation }))}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="fridge">冷蔵庫</option>
                  <option value="freezer">冷凍庫</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">種類</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as StockCategory }))}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#FF6B35]"
                >
                  <option value="drink">飲料</option>
                  <option value="food">食品</option>
                  <option value="vegetable">野菜</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">購入日</span>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-bold text-gray-500">期限</span>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35]"
                />
              </label>
            </div>

            <textarea
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="メモがあれば入力"
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#FF6B35]"
            />

            <button
              onClick={addStockItem}
              disabled={!form.name.trim()}
              className="w-full px-4 py-3 bg-[#FF6B35] text-white rounded-2xl text-sm font-bold disabled:bg-gray-300"
            >
              在庫に追加
            </button>
          </div>
        </div>

        {(['fridge', 'freezer'] as const).map((location) => (
          <section key={location} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">{locationLabels[location]}</h2>
              <span className="text-xs font-bold text-gray-400">{groupedItems[location].length}件</span>
            </div>

            {groupedItems[location].length === 0 ? (
              <p className="text-sm text-gray-400">まだ登録がありません</p>
            ) : (
              <div className="space-y-3">
                {groupedItems[location].map((item) => {
                  const expired = isExpired(item.expiryDate);
                  const soon = expiresSoon(item.expiryDate);

                  return (
                    <div key={item.id} className="rounded-2xl border border-gray-100 bg-[#FCFCFB] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">{item.name}</h3>
                            <span className="px-2 py-1 rounded-full bg-[#FFEDE6] text-[#D65428] text-[11px] font-bold">
                              {categoryLabels[item.category]}
                            </span>
                            {expired && (
                              <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-[11px] font-bold">
                                期限切れ
                              </span>
                            )}
                            {!expired && soon && (
                              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                                期限近い
                              </span>
                            )}
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-500">
                            <div>
                              <dt className="font-bold text-gray-400">購入日</dt>
                              <dd>{item.purchaseDate || '未設定'}</dd>
                            </div>
                            <div>
                              <dt className="font-bold text-gray-400">期限</dt>
                              <dd>{item.expiryDate || '未設定'}</dd>
                            </div>
                          </dl>
                          {item.note && <p className="mt-3 text-xs leading-relaxed text-gray-600">メモ: {item.note}</p>}
                        </div>
                        <button
                          onClick={() => removeStockItem(item.id)}
                          className="px-3 py-2 rounded-full bg-gray-100 text-xs font-bold text-gray-500"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}

        <button
          onClick={handleExport}
          disabled={stockItems.length === 0}
          className="w-full py-3 text-sm font-bold rounded-2xl bg-[#1F6B5B] text-white disabled:bg-gray-300"
        >
          TXT出力
        </button>
      </div>
    </div>
  );
}