import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMovieURL } from '../store/movieSlice';
import { VideoPlayer } from '../components/VideoPlayer';

export default function WatchMovie() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const movie = useSelector((state) =>
    state.movies.movies.find((m) => String(m.id) === id)
  );

  useEffect(() => {
    if (!movie?.movieUrl) {
      dispatch(getMovieURL(id));
    }
  }, [dispatch, id, movie]);

  if (!movie?.movieUrl) return <p>Loading movie...</p>;

  return (
    <div className='p-6 bg-black'>
      <VideoPlayer src={movie.movieUrl} />
    </div>
  );
}