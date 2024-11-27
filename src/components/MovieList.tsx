import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../firebase';
import { Film, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPoster } from '../utils/tmdb';
import { calculateAverageRating } from '../utils/ratings';
import ContentCard from './shared/ContentCard';
import Pagination from './shared/Pagination';
import toast from 'react-hot-toast';

interface Movie {
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

export default function MovieList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isListVisible, setIsListVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const itemsPerPage = 15;

  useEffect(() => {
    const moviesRef = ref(db, 'movies');
    const unsubscribe = onValue(moviesRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const moviesList = await Promise.all(
          Object.entries(data)
            .map(async ([id, movie]) => {
              const movieData = movie as Omit<Movie, 'id'>;
              if (movieData.contentType === 'movie') {
                const posterUrl = await getPoster(movieData.title, 'movie');
                return {
                  id,
                  ...movieData,
                  posterUrl,
                };
              }
              return null;
            })
            .filter((movie): movie is Promise<Movie | null> => movie !== null)
        );

        const filteredMovies = moviesList
          .filter((movie): movie is Movie => movie !== null)
          .filter(movie => {
            if (sortBy === 'must-watch') {
              return movie.category === 'must-watch';
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

        setMovies(filteredMovies);
        setCurrentPage(1); // Reset to first page when filter changes
      } else {
        setMovies([]);
      }
    });

    return () => unsubscribe();
  }, [sortBy]);

  const handleDelete = async (movieId: string) => {
    if (!user) {
      toast.error('Please sign in to delete');
      return;
    }

    try {
      await remove(ref(db, `movies/${movieId}`));
      toast.success('Movie deleted successfully');
    } catch (error) {
      toast.error('Failed to delete movie');
      console.error('Error deleting movie:', error);
    }
  };

  const handleRating = async (movieId: string, rating: number) => {
    if (!user) {
      toast.error('Please sign in to rate');
      return;
    }

    if (movies.find(m => m.id === movieId)?.userId === user.id) {
      toast.error('You cannot rate your own movie');
      return;
    }

    try {
      const ratingData = {
        value: rating,
        timestamp: Date.now(),
      };

      await update(ref(db, `movies/${movieId}/ratings/${user.id}`), {
        [Date.now()]: ratingData,
      });
      toast.success('Rating added successfully');
    } catch (error) {
      toast.error('Failed to add rating');
      console.error('Error adding rating:', error);
    }
  };

  const totalPages = Math.max(1, Math.ceil(movies.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMovies = movies.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <button
        onClick={() => setIsListVisible(!isListVisible)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Film className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">Movie List</h2>
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
              Showing {movies.length} movies
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
            {movies.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {sortBy === 'must-watch' 
                  ? 'No must-watch movies found' 
                  : 'No movies added yet'}
              </p>
            ) : (
              <>
                {currentMovies.map((movie) => (
                  <ContentCard
                    key={movie.id}
                    content={movie}
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