// MovieCard.js - Updated with better placeholder options

import React from 'react';
import { useNavigate } from 'react-router-dom';

const MovieCard = ({ movie }) => { sss
  const navigate = useNavigate();
  const baseURL = "https://movie-app-mbdk.onrender.com";

  const handleClick = () => {
    navigate(`/edit/${movie._id}`);
  };

  const handleImageError = (e) => {
    // Try different fallbacks in sequence
    if (e.target.src.includes('picsum')) {
      e.target.src = 'https://dummyimage.com/300x400/4a5568/ffffff&text=No+Image';
    } else if (e.target.src.includes('dummyimage')) {
      // Final fallback - inline SVG data URL
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
  };

  return (
    <div className="col-lg-3 col-md-4 col-sm-6 col-12 mb-4">
      <div className="card movie-card scale-in" onClick={handleClick}>
        <div className="movie-poster">
          <img 
            src={`${baseURL}/uploads/posters/${movie.poster}`} 
            className="card-img-top" 
            alt={movie.title}
            onError={handleImageError}
            crossOrigin="anonymous"
          />
        </div>
        <div className="card-body movie-card-body">
          <h6 className="movie-title">{movie.title}</h6>
          <p className="movie-year">{movie.publishingYear}</p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;