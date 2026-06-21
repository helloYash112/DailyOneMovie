import { useSelector } from "react-redux";
import { MovieCard } from "./MovieCard";

export function MovieList() {
  const { movies = [], fetchStatus } = useSelector(
    (state) => state.movies || {}
  );

  if (fetchStatus === "loading") {
    return <p>Loading movies...</p>;
  }

  if (!Array.isArray(movies) || movies.length === 0) {
    return <p>No movies available</p>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
