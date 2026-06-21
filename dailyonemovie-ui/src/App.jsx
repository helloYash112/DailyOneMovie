import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import DashBoard from "./pages/DashBoard";
import WatchMovie from "./pages/WatchMovie";
import Login from "./components/Login";

import { checkBackendHealth } from "./store/moviesThunk";
import { getCurrentUser } from "./store/authThunk";

export default function App() {

    const dispatch = useDispatch();
    

    const {
        isAuthenticated,
        loading
    } = useSelector(state => state.auth);
    console.log(isAuthenticated);

    useEffect(() => {

        // Check Spring Security Session
        dispatch(getCurrentUser());

        // Keep backend awake
       // dispatch(checkBackendHealth());
       /*
        const interval = setInterval(() => {
            dispatch(checkBackendHealth());
        }, 5 * 60 * 1000);
        */
        //return () => clearInterval(interval);

    }, [dispatch]);

    // Wait until auth check finishes
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Routes>

            <Route
                path="/login"
                element={
                    isAuthenticated
                        ? <Navigate to="/" replace />
                        : <Login />
                }
            />

            <Route
                path="/"
                element={
                    isAuthenticated
                        ? <DashBoard />
                        : <Navigate to="/login" replace />
                }
            />

            <Route
                path="/watch/:id"
                element={
                    isAuthenticated
                        ? <WatchMovie />
                        : <Navigate to="/login" replace />
                }
            />

        </Routes>
    );
}