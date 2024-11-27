import React, { useState } from 'react';
import { Star, User, Trash2 } from 'lucide-react';
import { calculateAverageRating } from '../../utils/ratings';
import { formatCategory } from '../../utils/formatting';

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    rating: number;
    category: 'must-watch' | 'good' | 'one-time-watch' | 'bad';
    language: string;
    ageRating: string;
    year: number;
    timestamp: number;
    userId: string;
    username: string;
    posterUrl?: string;
    ratings?: Record<string, Record<string, { value: number; timestamp: number; }>>;
  };
  currentUser?: { id: string; username: string } | null;
  onDelete?: (id: string) => void;
  onRate?: (id: string, rating: number) => void;
  showRank?: boolean;
  rank?: number;
}

const categoryColors: Record<ContentCardProps['content']['category'], { bg: string; text: string }> = {
  'must-watch': { bg: 'bg-green-50', text: 'text-green-700' },
  'good': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'one-time-watch': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'bad': { bg: 'bg-red-50', text: 'text-red-700' },
};

const ratingButtonClass = (isSelected: boolean, isHovered: boolean) => `
  w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
  ${isSelected 
    ? 'bg-indigo-600 text-white shadow-sm' 
    : isHovered
      ? 'bg-indigo-100 text-indigo-600'
      : 'bg-gray-100 text-gray-600'} 
  transition-all duration-200 touch-manipulation
  active:scale-95 hover:scale-105
  ${isSelected ? 'active:bg-indigo-700' : 'active:bg-gray-200'}
`;

const RATING_RANGE = Array.from({ length: 5 }, (_, i) => i + 6); // [6, 7, 8, 9, 10]

export default function ContentCard({ 
  content, 
  currentUser, 
  onDelete, 
  onRate,
  showRank,
  rank 
}: ContentCardProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleTouchStart = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleTouchEnd = () => {
    setHoveredRating(null);
  };

  const userRating = currentUser && content.ratings?.[currentUser.id];
  const lastRating = userRating ? 
    Object.values(userRating).sort((a, b) => b.timestamp - a.timestamp)[0]?.value 
    : null;

  const renderRatingButtons = () => (
    <div className="flex gap-1">
      {RATING_RANGE.map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onRate?.(content.id, rating)}
          onTouchStart={() => handleTouchStart(rating)}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setHoveredRating(rating)}
          onMouseLeave={() => setHoveredRating(null)}
          className={ratingButtonClass(
            lastRating === rating,
            hoveredRating !== null && rating <= hoveredRating
          )}
          title={`Rate ${rating}`}
        >
          {rating}
        </button>
      ))}
    </div>
  );

  return (
    <div className="border rounded-lg p-1.5 sm:p-3 hover:shadow-md transition duration-200">
      <div className="flex gap-2 sm:gap-3">
        {content.posterUrl && (
          <div className="w-[100px] sm:w-[120px] flex-shrink-0">
            <div className="relative pb-[150%]">
              <img
                src={content.posterUrl}
                alt={`${content.title} poster`}
                className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-md"
                loading="lazy"
              />
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
          <div className="flex items-start gap-2">
            {showRank && rank && (
              <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold shrink-0">
                #{rank}
              </span>
            )}
            <div className="flex justify-between items-start flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-800 truncate pr-2">{content.title}</h3>
              {currentUser && onDelete && (
                <button
                  onClick={() => onDelete(content.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  title="Delete content"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full w-fit">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span className="font-semibold text-yellow-700 text-xs">
              {calculateAverageRating(content)}/10
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            <div className={`px-2 py-0.5 rounded-full ${categoryColors[content.category].bg}`}>
              <span className={`text-xs font-medium ${categoryColors[content.category].text}`}>
                {formatCategory(content.category)}
              </span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-purple-50">
              <span className="text-xs font-medium text-purple-700">
                {content.language.charAt(0).toUpperCase() + content.language.slice(1)}
              </span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-red-50">
              <span className="text-xs font-medium text-red-700">
                {content.ageRating}
              </span>
            </div>
          </div>

          {currentUser && onRate && currentUser.id !== content.userId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Rate:</span>
              {renderRatingButtons()}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{content.username}</span>
            </div>
            <span>•</span>
            <span>{content.year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}