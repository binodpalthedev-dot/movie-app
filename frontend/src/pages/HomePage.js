// pages/HomePage.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import SignIn from '../components/Auth/SignIn';
import { Navigate } from 'react-router-dom';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/movies" replace />;
  }

  return <SignIn />;
};

export default HomePage;