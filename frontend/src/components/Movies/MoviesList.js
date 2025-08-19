// components/Movies/MoviesList.js
import React, { useState } from 'react';
import { LogOut, PlusCircleIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMovies } from '../../context/MoviesContext';
import { useNavigate } from 'react-router-dom';
import MovieCard from './MovieCard';

const MoviesList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 8;
  
  const { signOut } = useAuth();
  const { movies } = useMovies();
  const navigate = useNavigate();

  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = movies.length > 0 ? movies.slice(indexOfFirstMovie, indexOfLastMovie):[];
  const totalPages = Math.ceil(movies.length / moviesPerPage);

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

  const handleAddMovie = () => {
    navigate('/create');
  };

  return (
    <div className="page-background">
      <div className="container content-wrapper">
        <div className="movies-header">
          <div className="d-flex align-items-center">
            <h1 className="movies-title">My movies</h1>
            <span 
              className="movies-plus-icon"
              onClick={handleAddMovie}
              title="Add new movie"
            >
              <PlusCircleIcon size={16}/>
            </span>
          </div>
          <button 
            className="btn logout-btn"
            onClick={handleLogout}
          >
            <span>Logout</span>
            <LogOut size={18} />
          </button>
        </div>

        <div className="row">
          {currentMovies.length == 0 ? (
            <div className="col-12 text-center py-5">
              <p className="movie-title">No movies available</p>
            </div>
          ) : (
            currentMovies.map((movie,key) => (
              <MovieCard key={key} movie={movie} />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesList;