import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type MenuItem = {
  label: string;
  path: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'HOME', path: '/' },
  { label: 'RECIPE HUB', path: '/recipehub' },
  { label: 'STOCK HUB', path: '/stockhub' },
  { label: 'SETTINGS', path: '/settings' },
];

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[#eadfce] bg-[#fffaf2]/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-[0.16em] text-[#7a5c3e]">KITCHEN MASTER</h1>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full border border-[#e5d5c0] bg-[#fff6eb] px-3 py-2 text-sm font-bold text-[#5f4f40] transition hover:bg-[#f4e7d6]"
          >
            メニュー
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffaf2] shadow-lg">
              {MENU_ITEMS.map((item, index) => {
                const selected = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-bold transition ${
                      index > 0 ? 'border-t border-[#efe5d8]' : ''
                    } ${selected ? 'bg-[#f2e3d1] text-[#7a5c3e]' : 'text-[#5f4f40] hover:bg-[#f8eee1]'}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
