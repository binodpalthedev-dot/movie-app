// pages/MoviesPage.js
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMovies } from '../context/MoviesContext';
import { Navigate } from 'react-router-dom';
import MoviesList from '../components/Movies/MoviesList';
import EmptyState from '../components/Movies/EmptyState';

const MoviesPage = () => {
  const { isAuthenticated, initializing, user } = useAuth();
  const { movies, isLoading, error, refreshMovies } = useMovies();

  // Debug logging
  useEffect(() => {
    console.log('MoviesPage Debug Info:', {
      isAuthenticated,
      initializing,
      user,
      moviesCount: movies?.length || 0,
      isLoading,
      error,
      movies: movies
    });
  }, [isAuthenticated, initializing, user, movies, isLoading, error]);

  // Force fetch movies when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && !initializing && refreshMovies) {
      console.log('MoviesPage mounted, movies should auto-fetch via context');
      // No need to manually call fetch here, context handles it
    }
  }, [isAuthenticated, initializing]);

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="alert alert-danger mb-4">
            <h5>Error Loading Movies</h5>
            <p className="mb-0 d-none">{error}</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              console.log('Retrying fetch movies...');
              refreshMovies();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-white mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white">Loading movies...</p>
        </div>
      </div>
    );
  }

  // Debug: Log before checking movies length
  console.log('Movies array:', movies);
  console.log('Movies length:', movies?.length);
  console.log('Movies type:', typeof movies);
  console.log('Is movies array?', Array.isArray(movies));

  // Show empty state if no movies (with better checks)
  if (!movies || !Array.isArray(movies) || movies.length === 0) {
    return (
        <EmptyState />
    );
  }

  // Show movies list
  console.log('Rendering MoviesList with', movies.length, 'movies');
  return <MoviesList />;
};

export default MoviesPage;