import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { recipes as allRecipes } from '../data/recipes';
import { useSettings } from '../hooks/useSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SessionLikes } from '../types';
import SwipeCard from '../components/SwipeCard';
import type { Recipe } from '../types';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Home() {
  const navigate = useNavigate();
  const [settings] = useSettings();
  const [sessionLikes, setSessionLikes] = useLocalStorage<SessionLikes>('km_session_likes', { recipeIds: [] });

  const filteredRecipes = useMemo(() => {
    let filtered: Recipe[] = allRecipes;
    if (settings.maxCookingTime > 0) {
      filtered = filtered.filter(r => r.cookingTime <= settings.maxCookingTime);
    }
    if (settings.ngIngredients.length > 0) {
      filtered = filtered.filter(r =>
        !r.ingredients.some(ing =>
          settings.ngIngredients.some(ng =>
            ing.name.includes(ng)
          )
        )
      );
    }
    return shuffleArray(filtered);
  }, [settings]);

  const [deck, setDeck] = useState(filteredRecipes);
  const [swipedCount, setSwipedCount] = useState(0);
  const [lastSwipeDir, setLastSwipeDir] = useState<'left' | 'right' | null>(null);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (deck.length === 0) return;
    const recipe = deck[deck.length - 1];
    setLastSwipeDir(direction);
    if (direction === 'right') {
      setSessionLikes(prev => ({
        recipeIds: [...prev.recipeIds, recipe.id],
      }));
    }
    setDeck(prev => prev.slice(0, -1));
    setSwipedCount(prev => prev + 1);
  }, [deck, setSessionLikes]);

  const handleRestart = () => {
    setDeck(shuffleArray(filteredRecipes));
    setSwipedCount(0);
    setSessionLikes({ recipeIds: [] });
    setLastSwipeDir(null);
  };

  const handleDecide = () => {
    navigate('/match');
  };

  const currentCard = deck[deck.length - 1];
  const nextCard = deck[deck.length - 2];
  const thirdCard = deck[deck.length - 3];
  const isEmpty = deck.length === 0;
  const hasLikes = sessionLikes.recipeIds.length > 0;

  return (
    <div className="flex flex-col h-screen bg-[#FAFAF8]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">🍳 今日何食べる？</h1>
        <button
          onClick={() => navigate('/settings')}
          className="text-2xl p-1 hover:bg-gray-100 rounded-full transition"
        >
          ⚙️
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 py-2 text-sm text-gray-500 flex justify-between items-center">
        <span>{swipedCount}枚スワイプ済み</span>
        {hasLikes && (
          <span className="text-[#FF6B35] font-medium">❤️ {sessionLikes.recipeIds.length}件お気に入り</span>
        )}
      </div>

      {/* Card area */}
      <div className="flex-1 relative mx-5 my-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-6xl">🍽️</div>
            <p className="text-gray-500 text-lg text-center">
              {hasLikes ? 'カードがなくなりました！' : 'レシピがありません'}
            </p>
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-full text-lg hover:bg-gray-300 transition"
            >
              もう一度
            </button>
            {hasLikes && (
              <button
                onClick={handleDecide}
                className="px-8 py-3 bg-[#FF6B35] text-white font-bold rounded-full text-lg hover:bg-orange-500 transition shadow-lg"
              >
                決めた！🎉
              </button>
            )}
          </div>
        ) : (
          <div className="relative h-full">
            {thirdCard && (
              <SwipeCard
                key={`${thirdCard.id}-2`}
                recipe={thirdCard}
                onSwipe={() => {}}
                isTop={false}
                index={2}
              />
            )}
            {nextCard && (
              <SwipeCard
                key={`${nextCard.id}-1`}
                recipe={nextCard}
                onSwipe={() => {}}
                isTop={false}
                index={1}
              />
            )}
            <AnimatePresence>
              {currentCard && (
                <motion.div
                  key={currentCard.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{
                    x: lastSwipeDir === 'right' ? 400 : lastSwipeDir === 'left' ? -400 : 0,
                    opacity: 0,
                    transition: { duration: 0.3 },
                  }}
                >
                  <SwipeCard
                    recipe={currentCard}
                    onSwipe={handleSwipe}
                    isTop={true}
                    index={0}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      {!isEmpty && (
        <div className="flex justify-center items-center gap-8 py-5 bg-white border-t border-gray-100">
          <button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 bg-white border-2 border-red-400 text-red-400 rounded-full text-2xl flex items-center justify-center shadow-md hover:bg-red-50 transition active:scale-95"
          >
            ✕
          </button>
          {hasLikes && (
            <button
              onClick={handleDecide}
              className="px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-full text-sm hover:bg-orange-500 transition shadow-md active:scale-95"
            >
              決定！
            </button>
          )}
          <button
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 bg-white border-2 border-green-400 text-green-400 rounded-full text-2xl flex items-center justify-center shadow-md hover:bg-green-50 transition active:scale-95"
          >
            ❤️
          </button>
        </div>
      )}
    </div>
  );
}
