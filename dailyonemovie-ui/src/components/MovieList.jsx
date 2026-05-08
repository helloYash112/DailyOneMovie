import { useSelector } from 'react-redux';
import { MovieCard } from './MovieCard';

export function MovieList() {
  const { movies, status } = useSelector((state) => state.movies);

  if (status === 'loading') {
    return <p>Loading movies...</p>;
  }

  return (
    <div className='grid md:grid-cols-3 gap-6'>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}