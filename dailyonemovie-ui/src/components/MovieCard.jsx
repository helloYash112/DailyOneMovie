import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteMovieAndPoster } from "../store/movieSlice";

export function MovieCard({ movie }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return (
    <div className="relative rounded-md overflow-hidden bg-black shadow-lg transition duration-300 hover:scale-105">
      {/* Poster */}
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="w-full h-64 object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <h2 className="text-white font-semibold text-sm truncate">
          {movie.title}
        </h2>

        <p className="text-xs text-gray-300">
          {movie.genre} • ⭐ {movie.rating}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="flex-1 px-3 py-2 bg-white text-black text-xs font-semibold rounded"
          >
            Play
          </button>

          <button
            onClick={() => dispatch(deleteMovieAndPoster(movie.id))}
            className="px-3 py-2 border border-gray-600 text-xs text-white rounded"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
