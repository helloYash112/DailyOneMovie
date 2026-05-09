import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { upload } from "../store/movieSlice";

export default function UploadMovie() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state?.movies);
  //console.log("status", status, "error", error);
  const [progress, setProgress] = useState(0);
  const[isOpen,setIsOpen]=useState(false);
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
 

  return (
    <>
    <div>
        <h2 className="text-2xl font-bold text-gray-800">Your Library</h2>
        <p className="text-gray-500">Manage and upload your private movie collection</p>
      </div>
      
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Upload New Movie
      </button>
      { isOpen &&(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Upload Video</h3>
              <button onClick={() => !uploading && setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
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
      </div>
      </div>)
}
      
    </>
  );
}
