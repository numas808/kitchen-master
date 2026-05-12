import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-10">
      <AppHeader />

      <div className="p-5 space-y-5">
        <div className="rounded-2xl bg-gradient-to-r from-[#1F6B5B] to-[#FF6B35] p-[1px] shadow-sm">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold tracking-[0.2em] text-[#1F6B5B]">RECIPE HUB</p>
            <h2 className="mt-1 text-lg font-bold text-gray-800">今日の献立をAIで1件に絞る</h2>
            <p className="mt-2 text-sm text-gray-500">AIレシピ生成は RECIPE HUB から使えます。</p>
            <button
              onClick={() => navigate('/recipehub')}
              className="mt-4 rounded-full bg-[#1F6B5B] px-4 py-2 text-sm font-bold text-white"
            >
              RECIPE HUBを見る
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#1F6B5B]">STOCK HUB</p>
            <h2 className="mt-1 text-lg font-bold text-gray-800">家の在庫を管理する</h2>
            <p className="mt-2 text-sm text-gray-500">冷蔵庫と冷凍庫の食材、期限、メモをまとめて管理できます。</p>
            <button
              onClick={() => navigate('/stockhub')}
              className="mt-4 rounded-full bg-[#FF6B35] px-4 py-2 text-sm font-bold text-white"
            >
              STOCK HUBを見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
