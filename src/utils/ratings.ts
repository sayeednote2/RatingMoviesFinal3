export const calculateAverageRating = (content: {
  rating: number;
  ratings?: Record<string, Record<string, { value: number; timestamp: number; }>>;
}) => {
  const ratings = [content.rating]; // Include original rating
  
  if (content.ratings) {
    Object.values(content.ratings).forEach(userRatings => {
      // Get only the latest rating from each user
      const latestRating = Object.values(userRatings)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latestRating && typeof latestRating.value === 'number') {
        ratings.push(latestRating.value);
      }
    });
  }
  
  const sum = ratings.reduce((acc, val) => acc + val, 0);
  return (sum / ratings.length).toFixed(1);
};