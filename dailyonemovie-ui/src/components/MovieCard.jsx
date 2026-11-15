
import { useNavigate } from "react-router-dom";

export function MovieCard({ movie }) {
  const navigate = useNavigate();

  return (
    <div className="group overflow-hidden rounded-xl bg-gray-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">

      {/* Movie Poster */}
      <div className="relative overflow-hidden">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Movie Metadata */}
      <div className="p-4">

        <h2 className="truncate text-lg font-bold text-white">
          {movie.title}
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          {movie.genre}
          {movie.rating != null && ` • ⭐ ${movie.rating}`}
        </p>

        {/* Play Button */}
        <button
          onClick={() => navigate(`/watch/${movie.id}`)}
          className="mt-4 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200"
        >
          ▶ Play Movie
        </button>

      </div>
    </div>
  );
}
