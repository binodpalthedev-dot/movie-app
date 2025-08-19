// components/Movies/MovieForm.js
import React, { useState, useEffect } from 'react';
import { ArrowLeftCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '../../context/MoviesContext';

const MovieForm = ({ isEdit = false, movieId = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    publishingYear: '',
    poster: ''
  });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errorText, setErrorText] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const { addMovie, updateMovie, getMovie, deleteMovie } = useMovies();
  const navigate = useNavigate();
  const baseURL = "https://movie-app-mbdk.onrender.com";

  // Validation functions
  const validateTitle = (title) => {
    if (!title.trim()) return 'Movie title is required';
    if (title.trim().length < 2) return 'Title must be at least 2 characters long';
    if (title.trim().length > 100) return 'Title must be less than 100 characters';
    return '';
  };

  const validateYear = (year) => {
    const yearStr = String(year || '').trim();

    if (!yearStr) return 'Publishing year is required';

    const yearNum = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(yearNum)) return 'Year must be a valid number';
    if (yearNum < 1888) return 'Year must be 1888 or later (first motion picture)';
    if (yearNum > currentYear + 5) return `Year cannot be more than ${currentYear + 5}`;
    if (!/^\d{4}$/.test(yearStr)) return 'Year must be a 4-digit number';

    return '';
  };


  const validateImage = (file) => {
    if (!file) {
      return isEdit ? '' : 'Movie poster is required';
    }

    // Check file type
    if (!file.type || !file.type.startsWith('image/')) {
      return 'Please upload a valid image file';
    }

    // Check specific image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return 'Only JPEG, PNG, WebP, and GIF images are allowed';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return '';
  };

    const validateField = (name, value) => {
    switch (name) {
      case 'title':
        return validateTitle(value);
      case 'publishingYear':
        return validateYear(value);
      case 'poster':
        return validateImage(value);
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {
      title: validateTitle(formData.title),
      publishingYear: validateYear(formData.publishingYear),
      poster: validateImage(formData.poster)
    };
    
    setFieldErrors(newErrors);
    setTouched({
      title: true,
      publishingYear: true,
      poster: true
    });
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  useEffect(() => {
    if (isEdit && movieId) {
        const movie = getMovie(movieId);
        if (movie) {
          if(!formData.title) {
            setFormData(prev => ({
              ...prev,
              title: movie.title,
            }));
          }
          if(!formData.publishingYear) {
            setFormData(prev => ({
              ...prev, 
              publishingYear: movie.publishingYear,
            }));
          }
        if(!preview) setPreview(`${baseURL}/uploads/posters/${movie.poster}`);
      }
    }
  }, [isEdit, movieId, getMovie]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleFileSelect = (file) => {
    // Validate file immediately
    if(!file) setPreview(null);
    const imageError = validateImage(file);
    
    if (imageError) {
      setFieldErrors(prev => ({
        ...prev,
        poster: imageError
      }));
      setTouched(prev => ({
        ...prev,
        poster: true
      }));
      return;
    }

    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          poster: file
        }));
        setPreview(e.target.result);
        
        // Clear poster fieldErrors
        setFieldErrors(prev => ({
          ...prev,
          poster: ''
        }));
        setTouched(prev => ({
          ...prev,
          poster: true
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      title: true,
      publishingYear: true,
      poster: true
    });

    // Validate form
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("publishingYear", formData.publishingYear);
    if (formData.poster) {
      data.append("poster", formData.poster);
    }
    
    try {
      if (isEdit) {
        await updateMovie(movieId, data);
      } else {
        await addMovie(data);
      }
      navigate('/movies');
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/movies');
  };

  const handleDelete = async() => {
    if (isEdit && movieId) {
      if(window.confirm("Are you sure you want to delte this movie?")) {
        try {
          await deleteMovie(movieId);
          navigate('/movies');
        } catch (error) {
          console.error('Record deletion failed:', error);
        } finally {
          setLoading(false);
        }
      }
    } 
  };

  const getInputClassName = (fieldName) => {
    let className = "form-control form-control-lg form-input";
    
    if (touched[fieldName]) {
      if (fieldErrors[fieldName]) {
        className += " is-invalid";
      } else if (formData[fieldName]) {
        className += " is-valid";
      }
    }
    
    return className;
  };

  const getUploadAreaClassName = () => {
    let className = "image-upload-area";
    
    if (dragOver) className += " drag-over";
    if (touched.poster && fieldErrors.poster) className += " is-invalid";
    if (touched.poster && !fieldErrors.poster && (formData.poster || preview)) className += " is-valid";
    
    return className;
  };

  return (
    <div className="page-background">
      <div className="form-container">
        <div className="container content-wrapper">
          <h2 className="form-title">
            <button 
              type="button"
              className="btn btn-outline-light mx-2"
              onClick={handleCancel}
              title="Back"
            >
              <ArrowLeftCircle size={24} /> Back
            </button>
            {isEdit ? 'Edit' : 'Create a new movie'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div 
                  className={getUploadAreaClassName()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('posterInput').click()}
                >
                  {preview ? (
                    <img 
                      src={preview} 
                      alt="Movie poster preview" 
                      className="preview-image"
                      crossOrigin='true'
                    />
                  ) : (
                    <>
                      <Upload size={48} className="upload-icon" />
                      <p className="upload-text">
                        Drop an image here
                      </p>
                    </>
                  )}
                  <input 
                    id="posterInput"
                    type="file" 
                    accept="image/*" 
                    className="d-none"
                    onChange={handleFileInput}
                  />
                </div>
                {fieldErrors.poster && touched.poster && (
                  <div className="invalid-feedback d-block mt-2">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {fieldErrors.poster}
                  </div>
                )}
              </div>
              
              <div className="col-md-6">
                <div className="my-2">
                    <input 
                      type="text" 
                      name="title"
                      className={getInputClassName('title')}
                      placeholder="Title *"
                      value={formData.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength="100"
                    />
                    {touched.title && !fieldErrors.title && formData.title && (
                      <div className="position-absolute top-50 end-0 translate-middle-y my-3">
                        <i className="fas fa-check text-success"></i>
                      </div>
                    )}
                </div>
                {fieldErrors.title && touched.title && (
                    <div className="invalid-feedback d-block">
                      <i className="fas fa-exclamation-circle me-1"></i>
                      {fieldErrors.title}
                    </div>
                )}
                <div className="my-2">
                  <div className="position-relative">
                    <input 
                      type="text" 
                      name="publishingYear"
                      className={getInputClassName('publishingYear')}
                      placeholder="Publishing year *"
                      value={formData.publishingYear}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength="4"
                      pattern="[0-9]{4}"
                    />
                    {touched.publishingYear && !fieldErrors.publishingYear && formData.publishingYear && (
                      <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                        <i className="fas fa-check text-success"></i>
                      </div>
                    )}
                  </div>
                  {fieldErrors.publishingYear && touched.publishingYear && (
                    <div className="invalid-feedback d-block">
                      <i className="fas fa-exclamation-circle me-1"></i>
                      {fieldErrors.publishingYear}
                    </div>
                  )}
                  <small className="text-white">
                    Enter a 4-digit year (1888 - {new Date().getFullYear() + 5})
                  </small>
                </div>
                
                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="btn btn-cancel"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (isEdit ? 'Update' : 'Submit')}
                  </button>
                  { isEdit && <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={handleDelete}
                  >
                    Delete Movie ?
                  </button>
                  }
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MovieForm;