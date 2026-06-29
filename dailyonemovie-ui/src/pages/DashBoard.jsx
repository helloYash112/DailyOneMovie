import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMovies } from "../store/moviesThunk.js";
import { NavBar } from "../components/NavBar";
import MovieStatus from "../components/MovieStatus.jsx";
import { MovieList } from "../components/MovieList";
import { resetUploadState } from "../store/movieSlice.js";
import UploadHlsMovieForm from "../components/UploadHlsMovieForm.jsx";
import UploadMovies from "../components/UploadMovies.jsx"; // direct upload form

export default function DashBoard() {
  const dispatch = useDispatch();
  const { status, fetchStatus, movies, currentMovieId } = useSelector(
    (state) => state.movies
  );

  const [showForm, setShowForm] = useState(false);
  const [uploadType, setUploadType] = useState(null); // "direct" | "hls"

  // fetch movies initially
  useEffect(() => {
    if (movies.length === 0 && status === "idle") {
      dispatch(fetchMovies());
    }
  }, [status, movies.length, dispatch]);

  const handleBack = () => {
    dispatch(resetUploadState());
    setShowForm(false);
    setUploadType(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Default dashboard view */}
        {!showForm && (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              Upload a Movie
            </button>
            <MovieList />
          </>
        )}

        {/* Upload type selector */}
        {showForm && !uploadType && (
          <div className="flex flex-col items-center space-y-6 mt-10">
            <h2 className="text-2xl font-semibold">Choose Upload Method</h2>
            <div className="flex space-x-6">
              <button
                onClick={() => setUploadType("direct")}
                className="px-6 py-3 bg-green-600 rounded-lg shadow hover:bg-green-700 transition"
              >
                Direct Upload
              </button>
              <button
                onClick={() => setUploadType("hls")}
                className="px-6 py-3 bg-purple-600 rounded-lg shadow hover:bg-purple-700 transition"
              >
                HLS Upload
              </button>
            </div>
          </div>
        )}

        {/* Render chosen form */}
        {uploadType === "direct" && fetchStatus === "idle" && <UploadMovies />}
        {uploadType === "hls" && fetchStatus === "idle" && <UploadHlsMovieForm />}

        {/* Status view */}
        {(status === "uploading" || status === "success" || status === "fail") &&
          currentMovieId && (
            <div className="mt-8">
              <MovieStatus movieId={currentMovieId} />
              {(status === "success" || status === "fail") && (
                <button
                  onClick={handleBack}
                  className="mt-6 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
