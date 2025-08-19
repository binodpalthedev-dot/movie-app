// pages/MoviesPage.js
import React, { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMovies } from '../context/MoviesContext';
import { Navigate } from 'react-router-dom';
import MoviesList from '../components/Movies/MoviesList';
import EmptyState from '../components/Movies/EmptyState';

// Reusable loading spinner component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-white">{message}</p>
    </div>
  </div>
);

// Error state component
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <h5 className="font-bold text-lg mb-2">Error Loading Movies</h5>
        <p className="text-sm">{error || 'Something went wrong while loading your movies.'}</p>
      </div>
      <button 
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
        onClick={onRetry}
      >
        Try Again
      </button>
    </div>
  </div>
);

const MoviesPage = () => {
  const { isAuthenticated, initializing } = useAuth();
  const { movies, isLoading, error, refreshMovies } = useMovies();

  // Memoize the retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    refreshMovies();
  }, [refreshMovies]);

  // Early returns for different states
  if (initializing) {
    return <LoadingSpinner message="Initializing..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading movies..." />;
  }

  // Check for empty movies array
  const hasMovies = movies && Array.isArray(movies) && movies.length > 0;
  
  if (!hasMovies) {
    return <EmptyState />;
  }

  return <MoviesList />;
};

export default MoviesPage;