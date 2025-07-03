export async function refreshAccessToken() {
    const storage = localStorage.getItem("refreshToken") ? localStorage : sessionStorage;
    const refreshToken = storage.getItem("refreshToken");
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          refresh: refreshToken
        })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      storage.setItem("token", data.access);
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }
  
  export function getAuthToken() {
    // Check localStorage first, then sessionStorage
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }
  
  export function getUserData() {
    // Check localStorage first, then sessionStorage
    const userData = localStorage.getItem("user") || sessionStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }
  
  export function logout() {
    // Clear both storage locations
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
  }