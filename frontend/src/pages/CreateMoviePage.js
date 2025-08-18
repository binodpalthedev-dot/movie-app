// pages/CreateMoviePage.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import MovieForm from '../components/Movies/MovieForm';

const CreateMoviePage = () => {
  const { isAuthenticated, initializing } = useAuth();

  // Show loading while checking authentication
  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <MovieForm isEdit={false} />;
};

export default CreateMoviePage;