import { useEffect } from 'react';
import { useDispatch ,useSelector} from 'react-redux';
import { fetchMovies } from '../store/movieSlice';
import { NavBar } from '../components/NavBar';
import  UploadMovie  from '../components/UploadMovie.jsx';
import { MovieList } from '../components/MovieList';

export default function DashBoard() {
  const dispatch = useDispatch();
  const{status,movies}=useSelector(state =>state?.movies);

  
  useEffect(() => {
  
  if (movies.length === 0 && status === "idle") {
    dispatch(fetchMovies());
  }
}, [status, movies.length, dispatch]);
  return (
    <div className='min-h-screen bg-gray-100'>
      
      <NavBar />

      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        
        <UploadMovie />
        <MovieList />
      </div>
    </div>
  );
}