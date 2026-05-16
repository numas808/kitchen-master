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

const PAGE_TITLES: Record<string, string> = {
  '/': 'HOME',
  '/recipehub': 'RECIPE HUB',
  '/stock': 'STOCK HUB',
  '/stockhub': 'STOCK HUB',
  '/settings': 'SETTINGS',
};

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'KITCHEN MASTER';

  return (
    <header className="sticky top-0 z-20 bg-white px-5 py-4 shadow-sm">
      <div className="relative flex items-center justify-center">
        <h1 className="text-base font-bold tracking-[0.12em] text-black">{pageTitle}</h1>

        <div className="absolute right-0">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 text-black transition hover:bg-gray-100 focus:outline-none"
            aria-label="メニューを開く"
          >
            <HamburgerIcon />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {MENU_ITEMS.map((item, index) => {
                const selected = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition ${
                      index > 0 ? 'border-t border-gray-100' : ''
                    } ${selected ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'}`}
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
