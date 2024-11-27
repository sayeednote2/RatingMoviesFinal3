import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Trophy, ChevronDown, ChevronUp, Tv } from 'lucide-react';
import { getPoster } from '../utils/tmdb';
import { calculateAverageRating } from '../utils/ratings';
import Pagination from './shared/Pagination';
import ContentCard from './shared/ContentCard';

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

export default function TopTVSeries() {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isListVisible, setIsListVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
          .sort((a, b) => {
            const avgA = parseFloat(calculateAverageRating(a));
            const avgB = parseFloat(calculateAverageRating(b));
            return avgB - avgA;
          })
          .filter(series => series.year === selectedYear);

        setSeries(filteredSeries);
        setCurrentPage(1); // Reset to first page when year changes
      } else {
        setSeries([]);
      }
    });

    return () => unsubscribe();
  }, [selectedYear]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

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
          <Trophy className="w-6 h-6 text-yellow-500" />
          <Tv className="w-6 h-6 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-800">Top TV Series of {selectedYear}</h2>
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
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm border rounded-lg py-1.5 px-2"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {series.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No TV Series found for {selectedYear}</p>
            ) : (
              <>
                {currentSeries.map((series, index) => (
                  <ContentCard
                    key={series.id}
                    content={series}
                    showRank
                    rank={startIndex + index + 1}
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