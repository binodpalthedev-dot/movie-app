// pages/NotFoundPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="page-background">
      <div className="container content-wrapper">
        <div className="empty-state-container">
          <div className="empty-state">
            <div className="empty-state-content">
              <h1 className="empty-state-title">
                404
              </h1>
              <h2 className="empty-state-title">
                Page not found
              </h2>
              <div className="d-flex gap-3 justify-content-center mt-4">
                <button 
                  className="btn btn-outline-light"
                  onClick={handleGoBack}
                >
                  <ArrowLeft size={18} className="me-2" />
                  Go Back
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={handleGoHome}
                >
                  <Home size={18} className="me-2" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;