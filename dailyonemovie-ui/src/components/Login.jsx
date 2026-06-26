
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const loginWithGithub = () => {
    window.location.href =
      "http://localhost:8080/oauth2/authorization/github";
  };

  const handleGoogleLogin = () => {
    window.location.href =
      "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-6">

      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-200px] left-[-100px] w-[450px] h-[450px] bg-blue-600/20 blur-[140px] rounded-full"></div>

        <div className="absolute bottom-[-200px] right-[-100px] w-[450px] h-[450px] bg-purple-600/20 blur-[140px] rounded-full"></div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_60%)]"></div>
      </div>

      {/* Login Card */}
      <div
        className="
          relative z-10
          w-full max-w-md
          rounded-3xl
          border border-white/10
          bg-white/5
          backdrop-blur-xl
          shadow-[0_25px_80px_rgba(0,0,0,0.5)]
          p-10
        "
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="
              w-20 h-20
              rounded-2xl
              bg-gradient-to-br
              from-blue-500
              to-purple-600
              flex items-center justify-center
              text-4xl
              shadow-xl
            "
          >
            🎬
          </div>

          <h1 className="text-white text-3xl font-bold mt-6">
            Daily One Movie
          </h1>

          <p className="text-gray-400 text-center mt-3 text-sm">
            Continue your streaming journey securely
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">

          {/* GitHub */}
          <button
            onClick={loginWithGithub}
            className="
              group
              w-full
              flex
              items-center
              justify-center
              gap-3
              py-4
              rounded-xl
              bg-[#161b22]
              border border-[#30363d]
              text-white
              font-medium
              transition-all
              duration-300
              hover:border-white/30
              hover:-translate-y-1
              hover:shadow-xl
            "
          >
            <FaGithub className="text-xl group-hover:scale-110 transition-transform" />

            <span>Continue with GitHub</span>
          </button>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className="
              group
              w-full
              flex
              items-center
              justify-center
              gap-3
              py-4
              rounded-xl
              bg-white
              text-black
              font-medium
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-xl
            "
          >
            <FaGoogle className="text-xl text-red-500 group-hover:scale-110 transition-transform" />

            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-white/10"></div>

          <span className="px-4 text-gray-500 text-sm">
            secure authentication
          </span>

          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            By continuing, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

