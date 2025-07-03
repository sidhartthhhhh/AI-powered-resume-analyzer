import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar"; // Import Navbar
import ProtectedRoute from "./components/ProtectedRoute"; // Add this import
import "./App.css";

// Import pages
import Home from "./pages/Home";
import About from "./pages/About";
import UploadResume from "./pages/UploadResume";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

function App() {
  return (
    <Router>
      <Navbar /> {/* Navbar always visible */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/upload" element={
          <ProtectedRoute>
            <UploadResume />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;