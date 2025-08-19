import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EmptyState = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="page-background">
      <div className="empty-state-container">
        {/* Logout button - top right */}
        <div className="position-absolute top-0 end-0 m-4">
          <button 
            className="btn btn-outline-light"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>

        <div className="text-center fade-in">
          <h2 className="empty-state-title">
            Your movie list is empty
          </h2>
          <button 
            className="btn btn-lg add-movie-btn"
            onClick={() => navigate('/create')}
          >
            Add a new movie
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;