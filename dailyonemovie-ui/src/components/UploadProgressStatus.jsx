import React from "react";
import { useSelector } from "react-redux";

export default function UploadProgressStatus() {
   const {
    status,
    movieProgress,
    posterProgress,
    currentStep,
    error,
  } = useSelector((state) => state.movies);

  return (
    <div className="p-6 bg-zinc-900 rounded">
      {/* CURRENT STEP */}
      {currentStep && (
        <p className="text-sm text-gray-400">{currentStep}</p>
      )}

      {/* MOVIE PROGRESS */}
      {(status === "uploading" || movieProgress > 0) && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Movie Upload</span>
            <span>{movieProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${movieProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* POSTER PROGRESS */}
      {(status === "uploading" || posterProgress > 0) && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Poster Upload</span>
            <span>{posterProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${posterProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* STATUS MESSAGES */}
      {status === "saving" && (
        <p className="text-yellow-400 text-sm animate-pulse">
          Saving movie...
        </p>
      )}
      {status === "success" && (
        <p className="text-green-500 text-sm">
          Movie uploaded successfully 🎉
        </p>
      )}
      {status === "fail" && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
