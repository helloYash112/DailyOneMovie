// src/components/Login.jsx
import { FaGithub } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // If already logged in, go straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const loginWithGithub = () => {
    window.location.href = "https://dailyonemovie.onrender.com/oauth2/authorization/github";
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-6">
          Daily One Movie 🎬
        </h1>
        <p className="text-gray-400 mb-8">
          Sign in securely with your GitHub account to continue
        </p>

        <button
          onClick={loginWithGithub}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 
                     bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                     rounded-lg shadow-lg transition duration-300 ease-in-out"
        >
          <FaGithub className="text-2xl" />
          Login with GitHub
        </button>
      </div>
    </div>
  );
}
