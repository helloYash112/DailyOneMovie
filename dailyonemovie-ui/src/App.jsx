
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchCurrentUser } from "./store/authThunk";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./components/Login";
import DashBoard from "./pages/DashBoard";
import WatchMovie from "./pages/WatchMovie";
//import { checkBackendHealth } from "./store/moviesThunk";

export default function App() {
  const dispatch = useDispatch();

  const { isAuthenticated, loading } =
    useSelector((state) => state.auth);
    console.log(isAuthenticated,loading);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);


  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <Routes>
    <Route path="/login" element={<Login />} />
     <Route path="/" element={<PrivateRoute><DashBoard /></PrivateRoute>} />
     <Route path="/watch/:id" element={<PrivateRoute><WatchMovie /></PrivateRoute>} />
</Routes>

  );
}