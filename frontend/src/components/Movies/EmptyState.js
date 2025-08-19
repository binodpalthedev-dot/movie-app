import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const EmptyState = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout API fails
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="page-background">
      <div className="empty-state-container">
        {/* Logout button - top right */}
        <div className="position-absolute top-0 end-0 m-4">
          <button 
            className="btn logout-btn"
            onClick={handleLogout}
          >
            <span>Logout</span>
            <LogOut size={18}/>
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