import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./Login.css";
import { logout } from '../utils/auth';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
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
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
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
      // Clear any existing sessions before login
      logout();
      
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = "Login failed";
        
        // Handle specific error codes
        if (response.status === 404) {
          errorMessage = "User not found. Please register first.";
        } else if (response.status === 401) {
          errorMessage = "Incorrect email or password";
        } else if (response.status === 400) {
          errorMessage = data.error || "Invalid input data";
        } else {
          errorMessage = data.error || "Server error. Please try again later.";
        }
        
        setMessage({
          text: errorMessage,
          type: "error"
        });
        setIsLoading(false);
        return;
      }

      // Choose storage based on remember me option
      const storage = formData.rememberMe ? localStorage : sessionStorage;

      // Save tokens
      storage.setItem("token", data.access);
      storage.setItem("refreshToken", data.refresh);

      // Save user information
      if (data.user) {
        storage.setItem("user", JSON.stringify(data.user));
      }

      setMessage({
        text: "Login successful!",
        type: "success"
      });
      
      // Short delay to show the success message
      setTimeout(() => {
        setIsLoading(false);
        navigate("/upload");
      }, 500);
      
    } catch (error) {
      setMessage({
        text: "Network error - Please try again later",
        type: "error"
      });
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="form-container auth-form-container">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your ResumeMatch account</p>
          
          {message.text && (
            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
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
            </div>
            
            <div className="form-group remember-forgot">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe" className="checkbox-label">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-block ${isLoading ? "btn-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;