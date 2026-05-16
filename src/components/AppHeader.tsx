import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type MenuItem = {
  label: string;
  path: string;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'HOME', path: '/' },
  { label: 'MY RECIPES', path: '/recipehub' },
  { label: 'STOCK HUB', path: '/stockhub' },
  { label: 'SETTINGS', path: '/settings' },
];

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[#E8D8C8] bg-[#FFF8EF]/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-[0.16em] text-[#1A5C4A]">KITCHEN MASTER</h1>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-full border border-[#E8D8C8] p-2 text-[#3D2B1F] transition hover:bg-[#FFF0E0]"
            aria-label="メニューを開く"
          >
            <HamburgerIcon />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
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
                      index > 0 ? 'border-t border-gray-100' : ''
                    } ${selected ? 'bg-[#F0FBF7] text-[#1A5C4A]' : 'text-gray-700 hover:bg-gray-50'}`}
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
