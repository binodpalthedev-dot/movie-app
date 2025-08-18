// client/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://movie-app-mbdk.onrender.com/api',
  withCredentials: true, // Important for HTTP-only cookies
  timeout: 10000
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
    //   window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;