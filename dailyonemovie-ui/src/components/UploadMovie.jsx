import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { upload } from "../store/movieSlice";

export default function UploadMovie() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state?.movies);
  console.log("status", status, "error", error);
  const [progress, setProgress] = useState(0);

  const [form, setForm] = useState({
    title: "",
    genre: "",
    duration: "",
    rating: "",
    movieFile: null,
    posterFile: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setProgress(0);

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("genre", form.genre);
    formData.append("duration", Number(form.duration));
    formData.append("rating", Number(form.rating));
    formData.append("movieFile", form.movieFile);
    formData.append("posterFile", form.posterFile);

    dispatch(upload({ data:formData, onProgress: (val) => setProgress(val) }));
  };
  console.log("uploading progress :",progress);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 p-4 rounded-2xl shadow-lg bg-white"
      >
        <input
          className="border p-2 rounded-xl"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="border p-2 rounded-xl"
          placeholder="Genre"
          value={form.genre}
          onChange={(e) => setForm({ ...form, genre: e.target.value })}
        />

        <input
          className="border p-2 rounded-xl"
          placeholder="Duration"
          type="number"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />

        <input
          className="border p-2 rounded-xl"
          placeholder="Rating"
          type="number"
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
        />

        <input
          type="file"
          onChange={(e) => setForm({ ...form, movieFile: e.target.files[0] })}
        />

        <input
          type="file"
          onChange={(e) => setForm({ ...form, posterFile: e.target.files[0] })}
        />

        <button className="bg-black text-white py-2 rounded-xl">
          Upload Movie
        </button>
      </form>
      {/* Pending State: Show Progress Bar */}
      {status === "pending" && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 h-4 rounded">
            <div
              className="bg-blue-600 h-4 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>
            {progress === 100
              ? "Finalizing on server..."
              : `Uploading: ${progress}%`}
          </p>
        </div>
      )}

      {/* Success State */}
      {status === "success" && (
        <p className="text-green-500 mt-2">Movie uploaded successfully!</p>
      )}

      {/* Error State */}
      {status === "error" && (
        <p className="text-red-500 mt-2">Error: {error?.error}</p>
      )}
    </>
  );
}
