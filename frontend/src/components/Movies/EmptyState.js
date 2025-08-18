// components/Movies/EmptyState.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="page-background">
      <div className="empty-state-container">
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