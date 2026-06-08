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

  // ✅ Only show MovieStatus once we have an ID
  if (submitted && currentMovieId) {
    return <MovieStatus movieId={currentMovieId} />;
  }

  // ✅ While waiting for backend, show a loading message
  if (submitted && !currentMovieId) {
    return (
      <p className="text-blue-500 text-center mt-10">
        Uploading… waiting for movie ID from backend
      </p>
    );
  }

  // ✅ Otherwise show the form
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-xl font-semibold mb-4">Upload Movie</h2>

      <input type="text" name="title" placeholder="Title"
        value={form.title} onChange={handleChange}
        className="w-full border rounded p-2" />

      <input type="text" name="genre" placeholder="Genre"
        value={form.genre} onChange={handleChange}
        className="w-full border rounded p-2" />

      <input type="number" name="duration" placeholder="Duration (minutes)"
        value={form.duration} onChange={handleChange}
        className="w-full border rounded p-2" />

      <input type="number" step="0.1" name="rating" placeholder="Rating"
        value={form.rating} onChange={handleChange}
        className="w-full border rounded p-2" />

      <input type="file" name="movieFile" accept="video/*"
        onChange={handleChange} className="w-full border rounded p-2" />

      <input type="file" name="posterFile" accept="image/*"
        onChange={handleChange} className="w-full border rounded p-2" />

      <button type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
        Submit
      </button>
    </form>
  );
}
