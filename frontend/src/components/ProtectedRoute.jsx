import { Navigate } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

function ProtectedRoute({ children }) {
  const token = getAuthToken();
  
  if (!token) {
    // Redirect to login if no token exists
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  
  return children;
}

export default ProtectedRoute;