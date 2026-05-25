import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMovieURL } from '../store/moviesThunk';
import { VideoPlayer } from '../components/VideoPlayer';
import ShakaPlayer from '../components/player/ShakaPlayer';

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
  //<ShakaPlayer src={movie.movieUrl}></ShakaPlayer>
//<VideoPlayer src={movie.movieUrl} />
  return (
    <div className='p-6 bg-black'>
    
      
       <ShakaPlayer
        src={movie.movieUrl}
        autoPlay={true}
        muted={false}
        bufferingGoal={30}
        rebufferingGoal={15}
        
      />
    </div>
  );
}