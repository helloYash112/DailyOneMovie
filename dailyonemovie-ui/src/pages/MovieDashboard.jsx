
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { fetchMovies } from "../store/viewThunk";
import { MovieList } from "../components/MovieList";

export default function MovieDashboard() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMovies());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <h1 className="text-2xl font-bold tracking-wide text-red-500">
            DailyOneMovie
          </h1>

          <nav className="flex items-center gap-6 text-sm text-gray-300">
            <span className="cursor-pointer text-white">
              Home
            </span>
            <span className="cursor-pointer transition hover:text-white">
              Movies
            </span>
          </nav>

        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-10 md:px-12">

        {/* Page Heading */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold">
            Explore Movies
          </h2>

          <p className="mt-2 text-gray-400">
            Discover and watch your favourite movies.
          </p>
        </section>

        {/* Movie Collection */}
        <section>
          <MovieList />
        </section>

      </main>

    </div>
  );
}
