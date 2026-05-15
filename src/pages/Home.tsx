import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f0e7] pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        <div className="rounded-2xl bg-gradient-to-r from-[#7a5c3e] to-[#b89168] p-[1px] shadow-[0_8px_24px_rgba(101,75,49,0.15)]">
          <div className="rounded-2xl bg-[#fffaf2] p-4">
            <p className="text-xs font-bold tracking-[0.2em] text-[#7a5c3e]">RECIPE HUB</p>
            <h2 className="mt-1 text-lg font-bold text-[#3f3328]">今日の献立をAIで1件に絞る</h2>
            <p className="mt-2 text-sm text-[#7b6a5a]">AIレシピ生成は RECIPE HUB から使えます。</p>
            <button
              onClick={() => navigate('/recipehub')}
              className="mt-4 rounded-full bg-[#7a5c3e] px-4 py-2 text-sm font-bold text-[#fff8ed] shadow-sm transition hover:bg-[#664b31]"
            >
              RECIPE HUBを見る
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-[0_8px_22px_rgba(101,75,49,0.12)]">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#7a5c3e]">STOCK HUB</p>
            <h2 className="mt-1 text-lg font-bold text-[#3f3328]">家の在庫を管理する</h2>
            <p className="mt-2 text-sm text-[#7b6a5a]">冷蔵庫と冷凍庫の食材、期限、メモをまとめて管理できます。</p>
            <button
              onClick={() => navigate('/stockhub')}
              className="mt-4 rounded-full bg-[#b89168] px-4 py-2 text-sm font-bold text-[#fff8ed] shadow-sm transition hover:bg-[#a27d56]"
            >
              STOCK HUBを見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
