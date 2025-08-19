// components/Movies/MoviesList.js
import React, { useState, useMemo, useCallback } from 'react';
import { LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMovies } from '../../context/MoviesContext';
import { useNavigate } from 'react-router-dom';
import MovieCard from './MovieCard';

// Constants
const MOVIES_PER_PAGE = 8;

// Pagination component for better organization
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav className="flex justify-center mt-8" aria-label="Movies pagination">
      <ul className="flex items-center space-x-1">
        <li>
          <button 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-300'
            }`}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            Previous
          </button>
        </li>
        
        {visiblePages.map((page, index) => (
          <li key={`${page}-${index}`}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <button 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-300'
                }`}
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </li>
        ))}
        
        <li>
          <button 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              currentPage === totalPages 
                ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-300'
            }`}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

// Header component for better organization
const MoviesHeader = ({ moviesCount, onAddMovie, onLogout, isLoggingOut }) => (
  <header className="flex items-center justify-between mb-8 p-6 bg-white rounded-lg shadow-sm">
    <div className="flex items-center space-x-3">
      <h1 className="text-2xl font-bold text-gray-900">My Movies</h1>
      {moviesCount > 0 && (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {moviesCount} {moviesCount === 1 ? 'movie' : 'movies'}
        </span>
      )}
      <button 
        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors duration-200"
        onClick={onAddMovie}
        title="Add new movie"
        aria-label="Add new movie"
      >
        <PlusCircle size={20} />
      </button>
    </div>
    
    <button 
      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onLogout}
      disabled={isLoggingOut}
      aria-label="Sign out of your account"
    >
      <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
      <LogOut size={18} />
    </button>
  </header>
);

// Empty state component
const EmptyMoviesState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <div className="text-gray-400 mb-4">
      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
      </svg>
    </div>
    <p className="text-lg font-medium text-gray-600 mb-2">No movies on this page</p>
    <p className="text-gray-500">Try navigating to a different page or adding some movies.</p>
  </div>
);

const MoviesList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { signOut } = useAuth();
  const { movies } = useMovies();
  const navigate = useNavigate();

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const safeMovies = movies || [];
    const totalPages = Math.ceil(safeMovies.length / MOVIES_PER_PAGE);
    const indexOfLastMovie = currentPage * MOVIES_PER_PAGE;
    const indexOfFirstMovie = indexOfLastMovie - MOVIES_PER_PAGE;
    const currentMovies = safeMovies.slice(indexOfFirstMovie, indexOfLastMovie);
    
    return {
      currentMovies,
      totalPages,
      totalMovies: safeMovies.length
    };
  }, [movies, currentPage]);

  // Memoized handlers
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout API fails
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }, [signOut, navigate, isLoggingOut]);

  const handleAddMovie = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= paginationData.totalPages && page !== currentPage) {
      setCurrentPage(page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, paginationData.totalPages]);

  // Reset to first page if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, paginationData.totalPages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MoviesHeader 
          moviesCount={paginationData.totalMovies}
          onAddMovie={handleAddMovie}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginationData.currentMovies.length === 0 ? (
              <EmptyMoviesState />
            ) : (
              paginationData.currentMovies.map((movie, index) => (
                <MovieCard 
                  key={movie.id || `movie-${currentPage}-${index}`} 
                  movie={movie} 
                />
              ))
            )}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      </div>
    </div>
  );
};

export default MoviesList;