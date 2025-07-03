import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css";

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.agreeTerms) {
      errors.agreeTerms = "You must agree to the terms and conditions";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: "", type: "" });
  
    try {
      const response = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({
          text: "Account created successfully! Redirecting to login...",
          type: "success"
        });
        
        // Reset the form
        setFormData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeTerms: false
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // Handle specific error cases
        let errorMessage = data.error || "Signup failed.";
        
        if (response.status === 400) {
          if (data.error === "User already exists") {
            errorMessage = "This email is already registered. Please log in instead.";
          } else if (data.error.includes("password")) {
            errorMessage = data.error || "Password requirements not met.";
          } else if (data.error.includes("email")) {
            errorMessage = "Please provide a valid email address.";
          }
        }
        
        setMessage({ 
          text: errorMessage, 
          type: "error" 
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage({
        text: "Network error. Please try again later",
        type: "error"  // Fixed the incorrect type:error syntax
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="form-container auth-form-container">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join ResumeMatch and optimize your job search</p>
          
          {message.text && (
            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={formErrors.fullName ? "input-error" : ""}
              />
              {formErrors.fullName && <p className="error-message">{formErrors.fullName}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={formErrors.email ? "input-error" : ""}
              />
              {formErrors.email && <p className="error-message">{formErrors.email}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={formErrors.password ? "input-error" : ""}
              />
              {formErrors.password && <p className="error-message">{formErrors.password}</p>}
              <p className="password-hint">Must be at least 8 characters</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={formErrors.confirmPassword ? "input-error" : ""}
              />
              {formErrors.confirmPassword && <p className="error-message">{formErrors.confirmPassword}</p>}
            </div>
            
            <div className="form-group terms-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className={formErrors.agreeTerms ? "input-error" : ""}
                />
                <label htmlFor="agreeTerms" className="checkbox-label">
                  I agree to the <Link to="/terms" className="terms-link">Terms of Service</Link> and <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                </label>
              </div>
              {formErrors.agreeTerms && <p className="error-message">{formErrors.agreeTerms}</p>}
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-block ${isLoading ? "btn-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;