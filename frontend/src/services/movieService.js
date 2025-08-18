// client/src/services/movieService.js
import API from './api';

export const movieService = {
  getMovies: async (params = {}) => {
    const response = await API.get('/movies', { params });
    return response.data;
  },

  getMovie: async (id) => {
    const response = await API.get(`/movies/${id}`);
    return response.data;
  },

  createMovie: async (formData) => {
    const response = await API.post('/movies', formData);
    return response.data;
  },

  updateMovie: async (id, formData) => {
    const response = await API.put(`/movies/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteMovie: async (id) => {
    const response = await API.delete(`/movies/${id}`);
    return response.data;
  }
};