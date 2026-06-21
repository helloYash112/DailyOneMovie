import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearMovies } from '../store/movieSlice';
import { logout as logoutAction } from '../store/authSlice'; // 👈 rename import

export function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { backendAlive } = useSelector(state => state.movies);
  const {user} =useSelector(state =>state.auth);

  console.log(backendAlive);

  const handleLogout = () => {
    // Dispatch the logout action properly
    dispatch(logoutAction());
    dispatch(clearMovies()); // optional: clear movies state on logout
    navigate('/login');      // redirect to login page
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 shadow-md bg-white">
      <h1 className="text-2xl font-bold">DailyOneMovie</h1>
      {backendAlive ? "🟢 Online" : "🔴 Starting Server..."}
      <p>{user}</p>
      
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition"
      >
        Logout
      </button>
    </nav>
  );
}
