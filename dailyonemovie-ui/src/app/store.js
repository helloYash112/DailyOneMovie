import { configureStore } from '@reduxjs/toolkit';
import reducer from '../store/movieSlice';
import authReducer from "../store/authSlice";
import viewReducer from "../store/viewSlice";


export const store=configureStore({
    reducer:{
        movies:reducer,
        auth: authReducer,
        views:viewReducer
        
    }
})