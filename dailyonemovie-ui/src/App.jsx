
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchCurrentUser } from "./store/authThunk";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./components/Login";
import DashBoard from "./pages/DashBoard";
import WatchMovie from "./pages/WatchMovie";
import MovieDashboard from "./pages/MovieDashboard";
//import { checkBackendHealth } from "./store/moviesThunk";

export default function App() {

  return (
    <Routes>
    
     <Route path="/" element={<MovieDashboard></MovieDashboard>} />
     <Route path="/watch/:id" element={<WatchMovie></WatchMovie>} />
</Routes>

  );
}