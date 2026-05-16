import { useEffect, useRef, useState } from 'react';
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
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pageTitle = 'RECIPE HUB';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 10) {
        setIsHidden(true);
        setMenuOpen(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 0) {
        setIsHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-20 bg-white px-5 py-4 shadow-sm transition-transform duration-200 ease-in-out ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="relative flex items-center justify-center font-sans">
        <h1 className="text-base font-semibold tracking-[0.18em] uppercase text-black">{pageTitle}</h1>

        <div className="absolute right-0">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 text-black transition hover:bg-gray-100 focus:outline-none"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
          >
            <HamburgerIcon />
          </button>
        </div>

        <div className="absolute inset-x-0 top-full z-10">
          <div
            className={`mx-auto mt-2 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition duration-200 ease-out transform ${
              menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
            aria-hidden={!menuOpen}
          >
            {MENU_ITEMS.map((item, index) => {
              const selected = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-medium tracking-[0.08em] uppercase transition ${
                    index > 0 ? 'border-t border-gray-100' : ''
                  } ${selected ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
