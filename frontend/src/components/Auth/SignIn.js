import React, { useState, useCallback, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle state

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // ✅ Validation
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  }, []);

  const validatePassword = useCallback((password) => {
    if (!password) return "Password is required";
    if (password.length < 6)
      return "Password must be at least 6 characters long";
    return "";
  }, []);

  const validateField = useCallback(
    (name, value) => {
      switch (name) {
        case "email":
          return validateEmail(value);
        case "password":
          return validatePassword(value);
        default:
          return "";
      }
    },
    [validateEmail, validatePassword]
  );

  const validateForm = useCallback(() => {
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    setFieldErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  }, [formData, validateEmail, validatePassword]);

  // ✅ Handlers
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === "checkbox" ? checked : value;

      setFormData((prev) => ({ ...prev, [name]: newValue }));

      if (touched[name]) {
        const error = validateField(name, newValue);
        setFieldErrors((prev) => ({ ...prev, [name]: error }));
      }

      if (errorText) setErrorText("");
    },
    [touched, validateField, errorText]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name, value);
      setFieldErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setTouched({ email: true, password: true });

      if (!validateForm()) return;

      setLoading(true);
      setErrorText("");

      try {
        await signIn(formData.email, formData.password, formData.remember);
        navigate("/movies", { replace: true });
      } catch (error) {
        let errorMessage = "Sign in failed. Please try again.";
        if (error.message?.includes("invalid-email"))
          errorMessage = "Invalid email address";
        else if (error.message?.includes("user-not-found"))
          errorMessage = "No account found with this email";
        else if (error.message?.includes("wrong-password"))
          errorMessage = "Incorrect password";
        else if (error.message?.includes("too-many-requests"))
          errorMessage =
            "Too many failed attempts. Please try again later.";
        else if (error.message?.includes("user-disabled"))
          errorMessage = "This account has been disabled";
        setErrorText(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [formData, validateForm, signIn, navigate]
  );

  const getInputClassName = useCallback(
    (fieldName) => {
      let className = "form-control form-control-lg signin-input";
      if (touched[fieldName]) {
        if (fieldErrors[fieldName]) className += " is-invalid";
        else if (formData[fieldName]) className += " is-valid";
      }
      return className;
    },
    [touched, fieldErrors, formData]
  );

  const isFormValid = useMemo(() => {
    return (
      formData.email &&
      formData.password &&
      !fieldErrors.email &&
      !fieldErrors.password
    );
  }, [formData, fieldErrors]);

  return (
    <div className="page-background">
      <div className="signin-container">
        <div className="card signin-card">
          <div className="card-body p-5">
            <h2 className="mb-4 text-center">Sign In</h2>

            {errorText && (
              <div className="alert alert-danger">{errorText}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label text-white">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className={getInputClassName("email")}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <div className="invalid-feedback">{fieldErrors.email}</div>
                )}
              </div>

              {/* Password with toggle */}
              <div className="mb-3 position-relative">
                <label className="form-label text-white">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    className={getInputClassName("password")}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <div className="invalid-feedback d-block">
                    {fieldErrors.password}
                  </div>
                )}
              </div>

              {/* Remember me */}
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  className="form-check-input"
                  onChange={handleChange}
                  id="rememberMe"
                  disabled={loading}
                />
                <label className="form-check-label text-white" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading || !isFormValid}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;