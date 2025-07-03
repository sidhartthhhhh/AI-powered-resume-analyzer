import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuthToken, logout, getUserData } from "../utils/auth";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Check authentication status on mount and location change
  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    
    // Get user name if authenticated
    if (token) {
      const userData = getUserData();
      setUserName(userData?.name || "");
    }
  }, [location]);
  
  // Function to check if the link is active
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          ResumeMatch
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive("/")}`}>
            Home
          </Link>
          <Link to="/about" className={`nav-link ${isActive("/about")}`}>
            About
          </Link>
          
          {/* Only show Upload Resume if authenticated */}
          {isAuthenticated && (
            <Link to="/upload" className={`nav-link ${isActive("/upload")}`}>
              Upload Resume
            </Link>
          )}
        </div>
        
        <div className="navbar-auth">
          {isAuthenticated ? (
            /* Authenticated user options */
            <>
              {userName && <span className="user-greeting">Hello, {userName}</span>}
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </>
          ) : (
            /* Non-authenticated options */
            <>
              <Link to="/login" className={`nav-link ${isActive("/login")}`}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;