import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { data } from "react-router-dom";
import { normalizeFileType } from "./app.js";
import { sliceFileForUpload, runWithConcurrencyLimit, createUploadTasks,generateSafeFileName } from "./app.js";
import { setMovieProgress, setError, setStep, setPosterProgress } from "./movieSlice.js";


export const apiLink = import.meta.env.VITE_API_URL;
//export const apiLink = "http://localhost:8080";

export const  API = axios.create({
  baseURL: apiLink,
  withCredentials: true,
});

export const checkBackendHealth = createAsyncThunk(
    "movies/checkBackendHealth",
    async (_, { rejectWithValue }) => {
      console.log("wakeup the server");
        try {
            const response = await axios.get(
                `${apiLink}/movies/health`,
                {
                    timeout: 30000,
                }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue({
                alive: false,
                timestamp: Date.now(),
                error:
                    error.response?.data ||
                    error.message ||
                    "Backend unavailable",
            });
        }
    }
);

// Async thunk for uploading a rawmp4 and converting to hls fil
export const uploadHlsMovie = createAsyncThunk(
  "movies/uploadHlsMovie",
  async (movieData, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("title", movieData.title);
      formData.append("genre", movieData.genre);
      formData.append("duration", movieData.duration);
      formData.append("rating", movieData.rating);
      formData.append("movieFile", movieData.movieFile);
      formData.append("posterFile", movieData.posterFile);

      const response = await API.post("/movies/hls/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          dispatch(setMovieProgress(percent));
        },
      });

      return response.data; // DTO from backend
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
export const uploadMoviePipeline = createAsyncThunk(
  "movies/uploadMoviePipeline",
  async ({ title, genre, duration, rating, movieFile, posterFile }, thunkAPI) => {
    const { dispatch } = thunkAPI;

    try {
      // STEP 1: Slice movie file into chunks
      const fileChunks = sliceFileForUpload(movieFile);
      const totalParts = fileChunks.length;
      const totalFileSize = movieFile.size;

      dispatch(setMovieProgress(0));
      dispatch(setPosterProgress(0));

      // STEP 2: Initiate multipart upload for movie
    // STEP 2: Initiate multipart upload for movie
   
const initiateResponse = await dispatch(
  initiateMultiUploads({
    fileName:generateSafeFileName(title,movieFile.name),
    totalParts,
  })
).unwrap();

const { uploadId, fileKey, partUrls } = initiateResponse;


      // STEP 3: Upload movie chunks concurrently
      const uploadTasks = createUploadTasks(fileChunks, partUrls, totalFileSize, (progress) => {
        dispatch(setMovieProgress(progress));
      });
      dispatch(setStep("uploading file to cloud storage..."));
      const completedParts = await runWithConcurrencyLimit(4, uploadTasks);
      
      completedParts.sort((a, b) => a.partNumber - b.partNumber);
      
      // STEP 4: Complete multipart upload
      //console.log(completedParts);
      const completeResponse = await dispatch(
        completeMultiUploads({uploadId, fileKey, parts:completedParts})
      );
      const finalResult = completeResponse.data || completeResponse;
      
      
      // STEP 5: Get presigned URL for poster
      dispatch(setStep("getting upload request from api..."));
      const posRes = await dispatch( preparePutUrl({
        fileName: posterFile.name,
        contentType: posterFile.type
      })).unwrap(); // unwrap to get { uploadUrl, objectKey }
       
      // STEP 6: Upload poster file to cloud
      dispatch(setStep("poster is uploading to cloud..."));
      const cloudResponsePoster=await axios.put(posRes.uploadUrl, posterFile, {
        headers: {
          "Content-Type": posterFile.type
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
         dispatch(setPosterProgress(percent));
        },
      });
      
      // STEP 7: Save metadata
      const moviePayload = {
        title,
        genre,
        duration: Number(duration),
        rating: Number(rating),
        movieKey: fileKey,              // movie file key from earlier
        posterKey: posRes.objectKey // poster key from presigned URL response
      };
      dispatch(setStep("meta data saving to database..."))
      const dataRes = await dispatch(saveMovie(moviePayload)).unwrap();
      
      dispatch(setMovieProgress(100));
      return dataRes;

    } catch (err) {
      dispatch(setMovieProgress(0));
      dispatch(setPosterProgress(0));
      dispatch(setError(err.message));
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Upload pipeline failed"
      );
    }
  }
);
export const preparePutUrl = createAsyncThunk(
  "movies/ preparePutUrl",
  async (file, thunkAPI) => {
    try {
      const response = await API.post("movies/prepare-url", {
        fileName: file.name,
        contentType: file.type
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to generate presigned URL");
    }
  }
);

export const initiateMultiUploads = createAsyncThunk(
  "movies/initiateMultiUploads",
  async ({ fileName, totalParts }, thunkAPI) => {
    const data = { fileName, totalParts };
    const dispatch = thunkAPI.dispatch;

    try {
      dispatch(setStep("initiating multi-part upload request"));
      const response = await API.post("/movies/initiate", data);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "initiate request fail");
    }
  }
);

export const completeMultiUploads = createAsyncThunk(
  "movies/completeMultiUploads",
  async ({ uploadId, fileKey, parts }, thunkAPI) => {
    const data = { uploadId, fileKey, parts };
    const dispatch = thunkAPI.dispatch;
    //console.log(data);
    try {
      // 1. Update UI step status
      dispatch(setStep("finalizing multi-part upload"));

      // 2. Send the completion request to the backend
      const response = await API.post("movies/complete", data);

      // 3. Handle Axios vs custom wrappers (use response.data if using Axios)
      const result = response.data || response;

      // 4. Return the success response to the extraReducers
      return result; // Expected payload: "success" or { res: "success" }

    } catch (err) {
      // 5. Catch network or server errors gracefully
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message || "Finalize request failed");
    }
  }
);

export const uploadMovieFlow = createAsyncThunk(
  "movies/uploadMovieFlow",

  async (payload, thunkAPI) => {
    try {
      const dispatch = thunkAPI.dispatch;

      const { movieFile, posterFile, title, genre, duration, rating } = payload;
      
      // 1. Get URLs
      const urls = await dispatch(
        getUploadURL({
          movieFileName: generateSafeFileName(title,movieFile.name),
          movieFileType: normalizeFileType(movieFile.type),
          posterFileName: posterFile.name,
          posterFileType: normalizeFileType(posterFile.type),
        }),
      ).unwrap();
      // console.log("ui :",urls);
      // Upload movie
      await dispatch(
        uploadToCloudWithProgress({
          uploadURL: urls.movieUploadUrl,
          file: movieFile,
          type: "movie",
        }),
      ).unwrap();

      // Upload poster
      await dispatch(
        uploadToCloudWithProgress({
          uploadURL: urls.posterUploadUrl,
          file: posterFile,
          type: "poster",
        }),
      ).unwrap();

      // 4. Save movie
      const savedMovie = await dispatch(
        saveMovie({
          title,
          genre,
          duration,
          rating,
          movieKey: urls.movieKey,
          posterKey: urls.posterKey,
        }),
      ).unwrap();

      return savedMovie;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.message || "Upload flow failed");
    }
  },
);
//getting url to directly upload to cloud
export const getUploadURL = createAsyncThunk(
  "movies/getUploadURL",
  async (metaData, thunkAPI) => {
    try {
      const response = await API.post("/movies/upload-urls", metaData);

      return response.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data || "getting urls failure",
      );
    }
  },
);
//uploading file to server
export const uploadToCloudWithProgress = createAsyncThunk(
  "movies/uploadToCloudWithProgress",
  async ({ uploadURL, file, type }, thunkAPI) => {
    try {
      await axios.put(uploadURL, file, {
        headers: {},
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          if (type === "movie") thunkAPI.dispatch(setMovieProgress(percent));
          else if (type === "poster") thunkAPI.dispatch(setPosterProgress(percent));
        },
      });
      return true;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e?.response?.data || e.message || "upload failed",
      );
    }
  },
);

//saving movie meta data to database
export const saveMovie = createAsyncThunk(
  "movies/saveMovie",
  async (data, thunkAPI) => {
    try {
      const response = await API.post("movies/confirm-save", data);
      return response.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data || "fail to save into the database...",
      );
    }
  },
);
//uploading movies to the data base                                                                                   ok
export const upload = createAsyncThunk(
  "movies/upload",
  async ({ data, onProgress }, thunkAPI) => {
    try {
      const response = await API.post("/movies/upload", data, {
        onUploadProgress: (ProgressEvent) => {
          if (ProgressEvent.total && onProgress) {
            const percent = Math.round(
              (ProgressEvent.loaded * 100) / ProgressEvent.total,
            );
            onProgress(percent);
          }
        },
      });

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Upload failed");
    }
  },
);

//getting movie url                                                                                                  ok
export const getMovieURL = createAsyncThunk(
  "movies/getMovieURL",
  async (id, thunkAPI) => {
    try {
      const response = await API.get(`/movies/${id}/hls-stream`);

      return {
        id,
        movieUrl: response.data,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to fetch movie URL",
      );
    }
  },
);
//getting poster url                                                                                                  ok
export const getPosterURL = createAsyncThunk(
  "movies/getPosterURL",
  async (id, thunkAPI) => {
    try {
      const response = await API.get(`/movies/${id}/poster`);

      return {
        id,
        posterUrl: response.data,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to fetch poster URL",
      );
    }
  },
);

//getting all movies                                                                                                   ok
export const fetchMovies = createAsyncThunk(
  "movies/fetchMovies",
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/movies");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to fetch movies",
      );
    }
  },
);

//delete movies and poster from the data base                                                         ok
export const deleteMovieAndPoster = createAsyncThunk(
  "movies/deleteMovieAndPoster",
  async (id, thunkAPI) => {
    try {
      await API.delete(`/movies/${id}`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to delete movie",
      );
    }
  },
);

