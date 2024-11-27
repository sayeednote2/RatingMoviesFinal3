import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../firebase';
import { Tv, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPoster } from '../utils/tmdb';
import { calculateAverageRating } from '../utils/ratings';
import ContentCard from './shared/ContentCard';
import Pagination from './shared/Pagination';
import toast from 'react-hot-toast';

interface Series {
  id: string;
  title: string;
  rating: number;
  category: 'must-watch' | 'good' | 'one-time-watch' | 'bad';
  language: string;
  ageRating: string;
  contentType: 'movie' | 'tv-series';
  year: number;
  timestamp: number;
  userId: string;
  username: string;
  ratings?: Record<string, Record<string, { value: number; timestamp: number; }>>;
  posterUrl?: string;
}

type SortOption = 'latest' | 'rating' | 'must-watch';

export default function TVSeriesList() {
  const [series, setSeries] = useState<Series[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isListVisible, setIsListVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const itemsPerPage = 15;

  useEffect(() => {
    const seriesRef = ref(db, 'movies');
    const unsubscribe = onValue(seriesRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const seriesList = await Promise.all(
          Object.entries(data)
            .map(async ([id, series]) => {
              const seriesData = series as Omit<Series, 'id'>;
              if (seriesData.contentType === 'tv-series') {
                const posterUrl = await getPoster(seriesData.title, 'tv-series');
                return {
                  id,
                  ...seriesData,
                  posterUrl,
                };
              }
              return null;
            })
            .filter((series): series is Promise<Series | null> => series !== null)
        );

        const filteredSeries = seriesList
          .filter((series): series is Series => series !== null)
          .filter(series => {
            if (sortBy === 'must-watch') {
              return series.category === 'must-watch';
            }
            return true;
          })
          .sort((a, b) => {
            if (sortBy === 'latest') {
              return b.timestamp - a.timestamp;
            }
            const avgA = parseFloat(calculateAverageRating(a));
            const avgB = parseFloat(calculateAverageRating(b));
            return avgB - avgA;
          });

        setSeries(filteredSeries);
        setCurrentPage(1); // Reset to first page when filter changes
      } else {
        setSeries([]);
      }
    });

    return () => unsubscribe();
  }, [sortBy]);

  const handleDelete = async (seriesId: string) => {
    if (!user) {
      toast.error('Please sign in to delete');
      return;
    }

    try {
      await remove(ref(db, `movies/${seriesId}`));
      toast.success('TV Series deleted successfully');
    } catch (error) {
      toast.error('Failed to delete TV Series');
      console.error('Error deleting TV Series:', error);
    }
  };

  const handleRating = async (seriesId: string, rating: number) => {
    if (!user) {
      toast.error('Please sign in to rate');
      return;
    }

    if (series.find(s => s.id === seriesId)?.userId === user.id) {
      toast.error('You cannot rate your own TV Series');
      return;
    }

    try {
      const ratingData = {
        value: rating,
        timestamp: Date.now(),
      };

      await update(ref(db, `movies/${seriesId}/ratings/${user.id}`), {
        [Date.now()]: ratingData,
      });
      toast.success('Rating added successfully');
    } catch (error) {
      toast.error('Failed to add rating');
      console.error('Error adding rating:', error);
    }
  };

  const totalPages = Math.max(1, Math.ceil(series.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSeries = series.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <button
        onClick={() => setIsListVisible(!isListVisible)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tv className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">TV Series List</h2>
        </div>
        {isListVisible ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isListVisible && (
        <div className="p-5 border-t">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="text-sm text-gray-600">
              Showing {series.length} TV series
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border rounded-lg py-1.5 px-2"
            >
              <option value="latest">Latest</option>
              <option value="rating">Highest Rated</option>
              <option value="must-watch">Must Watch Only</option>
            </select>
          </div>

          <div className="space-y-4">
            {series.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {sortBy === 'must-watch' 
                  ? 'No must-watch TV series found' 
                  : 'No TV series added yet'}
              </p>
            ) : (
              <>
                {currentSeries.map((series) => (
                  <ContentCard
                    key={series.id}
                    content={series}
                    currentUser={user}
                    onDelete={handleDelete}
                    onRate={handleRating}
                  />
                ))}

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}