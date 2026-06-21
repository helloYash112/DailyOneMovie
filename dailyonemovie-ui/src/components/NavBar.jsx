import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearMovies } from '../store/movieSlice';

export function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = () => {
    dispatch(clearMovies());
    //navigate('/login');
  };

  return (
    <nav className='flex justify-between items-center px-6 py-4 shadow-md bg-white'>
      <h1 className='text-2xl font-bold'>DailyOneMovie</h1>
      
      <button
        onClick={logout}
        className='px-4 py-2 rounded-xl bg-black text-white'
      >
        Logout
      </button>
    </nav>
  );
}