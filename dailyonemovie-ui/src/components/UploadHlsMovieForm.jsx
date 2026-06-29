import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadHlsMovie } from "../store/moviesThunk";
import MovieStatus from "./MovieStatus";

export default function UploadHlsMovieForm() {
  const dispatch = useDispatch();
  const { status, currentMovieId } = useSelector((state) => state.movies);

  const [form, setForm] = useState({
    title: "",
    genre: "",
    duration: "",
    rating: "",
    movieFile: null,
    posterFile: null,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    dispatch(uploadHlsMovie(form));
  };

  // ✅ Show MovieStatus once we have an ID
  if (submitted && currentMovieId) {
    return <MovieStatus movieId={currentMovieId} />;
  }

  // ✅ Loading state
  if (submitted && !currentMovieId) {
    return (
      <p className="text-blue-400 text-center mt-10">
        Uploading… waiting for movie ID from backend
      </p>
    );
  }

  // ✅ Dark theme form
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg shadow-lg space-y-4"
    >
      <h2 className="text-2xl font-semibold text-white mb-4">
        Upload HLS Movie
      </h2>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        type="text"
        name="genre"
        placeholder="Genre"
        value={form.genre}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        type="number"
        name="duration"
        placeholder="Duration (minutes)"
        value={form.duration}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        type="number"
        step="0.1"
        name="rating"
        placeholder="Rating"
        value={form.rating}
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        type="file"
        name="movieFile"
        accept="video/*"
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <input
        type="file"
        name="posterFile"
        accept="image/*"
        onChange={handleChange}
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
      >
        Submit
      </button>
    </form>
  );
}
