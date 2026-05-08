import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteMovieAndPoster } from '../store/movieSlice';

export function MovieCard({ movie }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
   return (
    <div className='rounded-2xl overflow-hidden shadow-lg bg-white'>
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className='w-full h-64 object-cover'
      />

      <div className='p-4 space-y-2'>
        <h2 className='font-bold text-lg'>{movie.title}</h2>
        <p>{movie.genre}</p>
        <p>{movie.duration} min</p>
        <p>{movie.rating}</p>

        <div className='flex gap-2'>
          <button
            onClick={() => navigate(`/watch/${movie.id}`)}
            className='px-3 py-2 bg-black text-white rounded-xl'
          >
            Watch
          </button>

          <button
            onClick={() => dispatch(deleteMovieAndPoster(movie.id))}
            className='px-3 py-2 border rounded-xl'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}