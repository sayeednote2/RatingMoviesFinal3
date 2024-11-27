import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Film } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import MovieForm from './components/MovieForm';
import MovieList from './components/MovieList';
import TVSeriesList from './components/TVSeriesList';
import TopMovies from './components/TopMovies';
import TopTVSeries from './components/TopTVSeries';
import UserProfile from './components/UserProfile';

export default function App() {
  return (
    <AuthProvider>
      <div className="background-shapes">
        <div className="min-h-screen backdrop-blur-sm py-2 sm:py-4">
          <div className="container mx-auto px-1 sm:px-4 max-w-lg">
            <header className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center justify-center gap-2 bg-white/10 p-3 rounded-lg backdrop-blur-md">
                <Film className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Movie Ratings</h1>
              </div>
              <UserProfile />
            </header>

            <div className="space-y-3 sm:space-y-4">
              <MovieForm />
              <MovieList />
              <TVSeriesList />
              <TopMovies />
              <TopTVSeries />
            </div>
          </div>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              duration: 2000,
              style: {
                maxWidth: '90vw',
                margin: '0 auto 24px auto',
                fontSize: '0.875rem',
                padding: '0.75rem 1rem',
              },
            }} 
          />
        </div>
      </div>
    </AuthProvider>
  );
}