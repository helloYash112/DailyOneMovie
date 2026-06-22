import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) return <h2>Loading...</h2>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
