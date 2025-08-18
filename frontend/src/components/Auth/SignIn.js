import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return '';
  };

  // Real-time validation
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };

  const validateForm = () => {
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }));

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, newValue);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: error
      }));
    }

    // Clear general error when user starts typing
    if (errorText) {
      setErrorText('');
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true
    });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      await signIn(formData.email, formData.password, formData.remember);
      navigate('/movies', { replace: true });
    } catch (error) {
      // Handle specific error types
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('invalid-email')) {
          errorMessage = 'Invalid email address';
        } else if (error.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email';
        } else if (error.message.includes('wrong-password')) {
          errorMessage = 'Incorrect password';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.message.includes('user-disabled')) {
          errorMessage = 'This account has been disabled';
        }
      }
      
      setErrorText(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName) => {
    let className = "form-control form-control-lg signin-input";
    
    if (touched[fieldName]) {
      if (fieldErrors[fieldName]) {
        className += " is-invalid";
      } else if (formData[fieldName]) {
        className += " is-valid";
      }
    }
    
    return className;
  };

  const isFormValid = () => {
    return formData.email && 
           formData.password && 
           !fieldErrors.email && 
           !fieldErrors.password;
  };

  return (
    <div className="page-background">
      <div className="signin-container">
        <div className="card signin-card">
          <div className="card-body p-5">
            <h2 className="signin-title">Sign in</h2>
            
            {errorText && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {errorText}
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <div className="position-relative">
                  <input
                    type="email"
                    name="email"
                    className={getInputClassName('email')}
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="email"
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  />
                  {touched.email && !fieldErrors.email && formData.email && (
                    <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                      <i className="fas fa-check text-success"></i>
                    </div>
                  )}
                </div>
                {fieldErrors.email && touched.email && (
                  <div className="invalid-feedback d-block" id="email-error">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="position-relative">
                  <input
                    type="password"
                    name="password"
                    className={getInputClassName('password')}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {touched.password && !fieldErrors.password && formData.password && (
                    <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                      <i className="fas fa-check text-success"></i>
                    </div>
                  )}
                </div>
                {fieldErrors.password && touched.password && (
                  <div className="invalid-feedback d-block" id="password-error">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {fieldErrors.password}
                  </div>
                )}
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input signin-checkbox"
                  type="checkbox"
                  name="remember"
                  id="rememberMe"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label text-white"
                  htmlFor="rememberMe"
                >
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                className={`btn btn-lg w-100 signin-btn ${!isFormValid() || loading ? 'opacity-75' : ''}`}
                disabled={loading}
                aria-describedby="submit-help"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2 text-white" role="status" aria-hidden="true"></span>
                    <span className='text-white'>Signing in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;