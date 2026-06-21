import { configureStore } from '@reduxjs/toolkit';
import reducer from '../store/movieSlice';

export const store=configureStore({
    reducer:{
        movies:reducer
        
    }
})