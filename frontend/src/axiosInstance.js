// src/axiosInstance.js
import axios from "axios";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: "https://studentledinitiative.onrender.com/api",
});

// Add a request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // get token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;