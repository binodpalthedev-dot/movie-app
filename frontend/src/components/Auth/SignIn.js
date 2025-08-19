import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

// Constants
const VALIDATION_RULES = {
  email: {
    required: 'Email is required',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Please enter a valid email address'
  },
  password: {
    required: 'Password is required',
    minLength: 6,
    minLengthMessage: 'Password must be at least 6 characters long'
  }
};

const ERROR_MESSAGES = {
  'invalid-email': 'Invalid email address',
  'user-not-found': 'No account found with this email',
  'wrong-password': 'Incorrect password',
  'too-many-requests': 'Too many failed attempts. Please try again later.',
  'user-disabled': 'This account has been disabled',
  default: 'Sign in failed. Please try again.'
};

// Custom hooks for form validation
const useFormValidation = () => {
  const validateEmail = useCallback((email) => {
    const rules = VALIDATION_RULES.email;
    if (!email.trim()) return rules.required;
    if (!rules.pattern.test(email)) return rules.patternMessage;
    return '';
  }, []);

  const validatePassword = useCallback((password) => {
    const rules = VALIDATION_RULES.password;
    if (!password) return rules.required;
    if (password.length < rules.minLength) return rules.minLengthMessage;
    return '';
  }, []);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  }, [validateEmail, validatePassword]);

  return { validateField, validateEmail, validatePassword };
};

// Input component for better reusability
const FormInput = React.memo(({ 
  type, 
  name, 
  placeholder, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched, 
  showPassword,
  onTogglePassword,
  icon: Icon 
}) => {
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className="mb-4">
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          type={inputType}
          name={name}
          className={`
            w-full px-4 py-3 ${Icon ? 'pl-10' : ''} ${type === 'password' ? 'pr-10' : ''} 
            text-white bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200
            ${hasError 
              ? 'border-red-500 focus:ring-red-500/50' 
              : isValid 
                ? 'border-green-500 focus:ring-green-500/50'
                : 'border-gray-600 focus:ring-blue-500/50 focus:border-blue-500'
            }
          `}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required
          autoComplete={type === 'email' ? 'email' : 'current-password'}
          aria-describedby={hasError ? `${name}-error` : undefined}
          aria-invalid={hasError}
        />

        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}

        {isValid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="flex items-center mt-2 text-red-400 text-sm" id={`${name}-error`}>
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

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
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { validateField, validateEmail, validatePassword } = useFormValidation();

  // Memoized form validation
  const isFormValid = useMemo(() => {
    return formData.email && 
           formData.password && 
           !fieldErrors.email && 
           !fieldErrors.password;
  }, [formData.email, formData.password, fieldErrors.email, fieldErrors.password]);

  const validateForm = useCallback(() => {
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  }, [formData.email, formData.password, validateEmail, validatePassword]);

  const handleChange = useCallback((e) => {
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
  }, [touched, validateField, errorText]);

  const handleBlur = useCallback((e) => {
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
  }, [validateField]);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const getErrorMessage = useCallback((error) => {
    if (!error?.message) return ERROR_MESSAGES.default;
    
    const errorKey = Object.keys(ERROR_MESSAGES).find(key => 
      error.message.includes(key)
    );
    
    return ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.default;
  }, []);

  const handleSubmit = useCallback(async (e) => {
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
      const errorMessage = getErrorMessage(error);
      setErrorText(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, signIn, navigate, getErrorMessage]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to your account</p>
          </div>
          
          {errorText && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg" role="alert">
              <div className="flex items-center text-red-200">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{errorText}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={fieldErrors.email}
              touched={touched.email}
              icon={Mail}
            />

            <FormInput
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={fieldErrors.password}
              touched={touched.password}
              showPassword={showPassword}
              onTogglePassword={handleTogglePassword}
              icon={Lock}
            />

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-sm text-gray-300">Remember me</span>
              </label>
              
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => {/* Handle forgot password */}}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`
                w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                text-white font-medium rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                disabled:cursor-not-allowed disabled:opacity-50
                ${loading ? 'cursor-wait' : ''}
              `}
              aria-describedby="submit-help"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                onClick={() => {/* Handle sign up navigation */}}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;