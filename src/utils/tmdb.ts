const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function getPoster(title: string, type: 'movie' | 'tv-series'): Promise<string | null> {
  try {
    const searchType = type === 'movie' ? 'movie' : 'tv';
    const response = await fetch(
      `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const posterPath = data.results[0].poster_path;
      return posterPath ? `https://image.tmdb.org/t/p/w200${posterPath}` : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching poster:', error);
    return null;
  }
}