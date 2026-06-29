import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

//import { uploadMovieFlow } from "../store/moviesThunk";
import { uploadMoviePipeline } from "../store/moviesThunk";
import UploadProgressStatus from "./UploadProgressStatus";

export default function UploadMovies() {
  const dispatch = useDispatch();
  const { status, movieProgress, posterProgress, currentStep, error } =
    useSelector((state) => state.movies);

  // form state
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [rating, setRating] = useState("");
  const [movieFile, setMovieFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
 

  // reset form fields
  const resetForm = () => {
    setTitle("");
    setGenre("");
    setDuration("");
    setRating("");
    setMovieFile(null);
    setPosterFile(null);
  };

  // submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!movieFile || !posterFile) {
      alert("Please select movie and poster files");
      return;
    }

    try {
      await dispatch(
        uploadMoviePipeline({
          title,
          genre,
          duration: Number(duration),
          rating: Number(rating),
          movieFile,
          posterFile,
        }),
      ).unwrap();

      resetForm();
      setForm(false); // close form after success
    } catch (err) {
      console.error(err);
    }
  };

 

  return (
    <div>
    
        <div className="max-w-xl mx-auto bg-zinc-900 rounded-xl p-6 shadow-xl text-white align-middle">
          <h1 className="text-2xl font-bold mb-6 text-gray-500">
            Upload Movie
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* TITLE */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Movie Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 outline-none focus:border-red-500"
                required
              />
            </div>

            {/* GENRE */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 outline-none focus:border-red-500"
                required
              />
            </div>

            {/* DURATION */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 outline-none focus:border-red-500"
                required
              />
            </div>

            {/* RATING */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">Rating</label>
              <input
                type="number"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 outline-none focus:border-red-500"
                required
              />
            </div>

            {/* MOVIE FILE */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Movie File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setMovieFile(e.target.files[0])}
                className="w-full text-sm text-gray-300"
                required
              />
            </div>

            {/* POSTER FILE */}
            <div>
              <label className="block mb-1 text-sm text-gray-400">
                Poster File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPosterFile(e.target.files[0])}
                className="w-full text-sm text-gray-300"
                required
              />
            </div>

            <UploadProgressStatus />

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={["loading", "uploading", "saving"].includes(status)}
              className="w-full bg-red-600 hover:bg-red-700 transition rounded py-3 font-semibold disabled:opacity-50"
            >
              {status === "uploading"
                ? "Uploading..."
                : status === "saving"
                  ? "Saving..."
                  : "Upload Movie"}
            </button>
          </form>
        </div>
    </div>
  );
}
