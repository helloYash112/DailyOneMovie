import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMovieURL } from '../store/moviesThunk';
//import { VideoPlayer } from '../components/VideoPlayer';
import ShakaPlayer from '../components/player/ShakaPlayer';
import { apiLink } from '../store/moviesThunk';


export default function WatchMovie() {
  const { id } = useParams();
  const dispatch = useDispatch();
  ///console.log(id);
  let url=apiLink+`/movies/${id}/manifest`
console.log(url);
  const movie = useSelector((state) =>
    state.movies.movies.find((m) => String(m.id) === id)
  );
/*
 <ShakaPlayer
        src={movie.movieUrl}
        autoPlay={true}
        muted={false}
        bufferingGoal={30}
        rebufferingGoal={15}
        
      />*/
  useEffect(() => {
    if (!movie?.movieUrl) {
      dispatch(getMovieURL(id));
    }
  }, [dispatch, id, movie]);

  if (!movie?.playlistUrl) return <p>Loading movie...</p>;

//<VideoPlayer src={movie.movieUrl} />
  return (
    <div className='p-6 bg-black'>
    
      <ShakaPlayer src={url} />
    </div>
  );
}
