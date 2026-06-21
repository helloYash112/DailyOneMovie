import { FaGithub } from "react-icons/fa";

export default function Login() {
  const loginWithGithub = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/github";
  };

  return (
    <div className="flex items-center justify-center min-h-screen  from-gray-900 via-black to-gray-800">
      <div className="bg-gray-900 bg-opacity-80 p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Daily One Movie
        </h1>

        <button
          onClick={loginWithGithub}
          className="flex items-center justify-center w-full py-3 px-4  from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition duration-300 ease-in-out"
        >
          <FaGithub className="mr-2 text-2xl" />
          Login with GitHub
        </button>

        <p className="text-gray-400 text-sm text-center mt-6">
          Experience movies daily with a seamless login
        </p>
      </div>
    </div>
  );
}
