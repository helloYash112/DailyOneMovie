import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMovies } from "../store/moviesThunk.js";
import { NavBar } from "../components/NavBar";
import MovieStatus from "../components/MovieStatus.jsx";
import { MovieList } from "../components/MovieList";
import { resetUploadState } from "../store/movieSlice.js";
import UploadHlsMovieForm from "../components/UploadHlsMovieForm.jsx";

export default function DashBoard() {
  const dispatch = useDispatch();
  const { status,fetchStatus, movies, currentMovieId } = useSelector((state) => state.movies);
  const [showForm, setShowForm] = useState(false);
  console.log("status :",status,"curent_movie_id :",currentMovieId);

  // fetch movies initially
  useEffect(() => {
    if (movies.length === 0 && status === "idle") {
      dispatch(fetchMovies());
    }
  }, [status, movies.length, dispatch]);

  const handleBack = () => {
    dispatch(resetUploadState());
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-black">
      <NavBar />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {!showForm && (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Upload a Movie
            </button>
            <MovieList />
          </>
        )}

        {showForm && fetchStatus === "idle" && <UploadHlsMovieForm></UploadHlsMovieForm>}
      </div>
    </div>
  );
}
