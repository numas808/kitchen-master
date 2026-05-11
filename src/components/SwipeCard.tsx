import { useMotionValue, useTransform, motion } from 'framer-motion';
import type { Recipe } from '../types';

interface SwipeCardProps {
  recipe: Recipe;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  index: number;
}

export default function SwipeCard({ recipe, onSwipe, isTop, index }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, -10], [1, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const cardStyle = {
    zIndex: 10 - index,
    scale: 1 - index * 0.04,
    y: index * 8,
  };

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 bg-white rounded-2xl shadow-lg"
        style={{
          zIndex: cardStyle.zIndex,
          transform: `scale(${cardStyle.scale}) translateY(${cardStyle.y}px)`,
        }}
      >
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-[60%] object-cover rounded-t-2xl"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 bg-white rounded-2xl shadow-xl cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      {/* Like indicator */}
      <motion.div
        className="absolute top-6 left-6 z-10 bg-green-500 text-white font-bold text-2xl px-4 py-2 rounded-xl border-4 border-green-500 rotate-[-15deg]"
        style={{ opacity: likeOpacity }}
      >
        ❤️ LIKE
      </motion.div>

      {/* Dislike indicator */}
      <motion.div
        className="absolute top-6 right-6 z-10 bg-red-500 text-white font-bold text-2xl px-4 py-2 rounded-xl border-4 border-red-500 rotate-[15deg]"
        style={{ opacity: dislikeOpacity }}
      >
        ✕ NOPE
      </motion.div>

      <img
        src={recipe.image}
        alt={recipe.name}
        className="w-full h-[60%] object-cover rounded-t-2xl pointer-events-none"
      />

      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">{recipe.name}</h2>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">
            🕐 {recipe.cookingTime}分
          </span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            recipe.difficulty === 'easy'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {recipe.difficulty === 'easy' ? '⭐ 簡単' : '⭐⭐ 普通'}
          </span>
          {recipe.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

