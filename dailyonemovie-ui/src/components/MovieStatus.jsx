import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API } from "../store/moviesThunk";
import { setStatus, setMovieProgress, setError,resetUploadState } from "../store/movieSlice";

export default function MovieStatus({ movieId }) {
  const dispatch = useDispatch();
  const { status, movieProgress, error } = useSelector(
    (state) => state.movies
  );

  useEffect(() => {
    if (!movieId) return;

    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/movies/${movieId}/status`);
        const data = res.data;

        const normalizedStatus = data.status.toLowerCase();
        dispatch(setStatus(normalizedStatus));
        dispatch(setMovieProgress(data.progress));

        // ✅ Stop polling once READY (or success)
        if (normalizedStatus === "ready" || normalizedStatus === "success") {
          clearInterval(interval);
          dispatch(resetUploadState());
        }
      } catch (err) {
        dispatch(setError(err.message));
        clearInterval(interval); // stop polling on error too
        dispatch(resetUploadState());
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [movieId, dispatch]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Movie Upload Status</h2>

      <p className="mb-2 text-gray-600">Status: {status}</p>

      {(status === "uploading" || movieProgress > 0) && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Movie Upload</span>
            <span>{movieProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${movieProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {status === "fail" && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {status === "success" || status === "ready" ? (
        <p className="text-green-600 text-sm mt-2">
          Movie uploaded successfully 🎉
        </p>
      ) : null}
    </div>
  );
}
