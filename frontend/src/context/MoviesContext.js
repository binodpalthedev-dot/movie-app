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
    
    console.log('Fetching movies for user:', user?.email);
    setIsLoading(true);
    setError(null);

    try {
      // Add delay for demo purposes (you can remove this)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = await movieService.getMovies();
      console.log('Raw data from movieService:', data);
      
      const moviesArray = Array.isArray(data) ? data : data.movies || [];
      console.log('Processed movies array:', moviesArray);
      
      setMovies(moviesArray);
    } catch (error) {
      console.error('Movies fetching failed:', error);
      setError(error.message || 'Failed to fetch movies');
      setMovies([]); // Clear movies on error
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle authentication changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated, 
      user: user?.email, 
      initializing,
      didFetchForUser: didFetchForUser.current 
    });

    if (initializing) {
      // Still initializing, don't do anything
      return;
    }

    if (isAuthenticated && user) {
      // User is authenticated
      const currentUserId = user.uid || user.email;
      
      if (didFetchForUser.current !== currentUserId) {
        // First time fetching for this user, or different user
        console.log('Fetching movies for new/different user');
        didFetchForUser.current = currentUserId;
        fetchMovies();
      }
    } else {
      // User is not authenticated, clear data
      console.log('User not authenticated, clearing movies');
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
      await fetchMovies(); // Refetch to get updated list
    } catch (error) {
      console.error("Adding movie failed:", error);
      setError(error.message || 'Failed to add movie');
      throw error; // Re-throw so UI can handle it
    }
  };

  const updateMovie = async (id, updatedMovie) => {
    try {
      setError(null);
      await movieService.updateMovie(id, updatedMovie);
      await fetchMovies(); // Refetch to get updated list
    } catch (error) {
      console.error("Updating movie failed:", error);
      setError(error.message || 'Failed to update movie');
      throw error;
    }
  };

  const deleteMovie = async (id) => {
    try {
      setError(null);
      await movieService.deleteMovie(id);
      await fetchMovies(); // Refetch to get updated list
    } catch (error) {
      console.error("Deleting movie failed:", error);
      setError(error.message || 'Failed to delete movie');
      throw error;
    }
  };

  const getMovie = (id) => {
    return movies.find(movie => movie._id === id || movie.id === id);
  };

  // Manual refresh function
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