// context/MoviesContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { movieService } from '../services/movieService';

const MoviesContext = createContext();

export const useMovies = () => {
  const context = useContext(MoviesContext);
  if (!context) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
};

export const MoviesProvider = ({ children }) => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const didFetchForUser = useRef(null);
  const { isAuthenticated, user, initializing } = useAuth();

  const fetchMovies = async () => {
    if (isLoading || !isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const data = await movieService.getMovies();
      const moviesArray = Array.isArray(data) ? data : data.movies || [];
      setMovies(moviesArray);
    } catch (error) {
      setError(error.message || 'Failed to fetch movies');
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initializing) return;

    if (isAuthenticated && user) {
      const currentUserId = user.uid || user.email;
      
      if (didFetchForUser.current !== currentUserId) {
        didFetchForUser.current = currentUserId;
        fetchMovies();
      }
    } else {
      setMovies([]);
      setIsLoading(false);
      setError(null);
      didFetchForUser.current = null;
    }
  }, [isAuthenticated, user, initializing]);

  const addMovie = async (movie) => {
    try {
      setError(null);
      await movieService.createMovie(movie);
      await fetchMovies();
    } catch (error) {
      setError(error.message || 'Failed to add movie');
      throw error;
    }
  };

  const updateMovie = async (id, updatedMovie) => {
    try {
      setError(null);
      await movieService.updateMovie(id, updatedMovie);
      await fetchMovies();
    } catch (error) {
      setError(error.message || 'Failed to update movie');
      throw error;
    }
  };

  const deleteMovie = async (id) => {
    try {
      setError(null);
      await movieService.deleteMovie(id);
      await fetchMovies();
    } catch (error) {
      setError(error.message || 'Failed to delete movie');
      throw error;
    }
  };

  const getMovie = (id) => {
    return movies.find(movie => movie._id === id || movie.id === id);
  };

  const refreshMovies = async () => {
    if (isAuthenticated) {
      await fetchMovies();
    }
  };

  const value = {
    movies,
    isLoading,
    error,
    fetchMovies,
    refreshMovies,
    addMovie,
    updateMovie,
    deleteMovie,
    getMovie
  };

  return (
    <MoviesContext.Provider value={value}>
      {children}
    </MoviesContext.Provider>
  );
};