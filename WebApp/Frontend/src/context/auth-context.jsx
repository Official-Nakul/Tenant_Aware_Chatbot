import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
const API_BASE_URL = "https://tenant-aware-chatbot-1.onrender.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;

          // Verify token with backend
          const response = await axios.get(`${API_BASE_URL}/auth/verify-token`);
          if (!response.data.valid) {
            signout();
          }
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        signout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signup = async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { user: userData, token } = response.data;

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      setUser(userData);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error("Signup error:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || "Signup failed",
      };
    }
  };

  const signin = async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
        email: formData.email,
        password: formData.password,
      });

      const { user: userData, token } = response.data;

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      setUser(userData);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error("Signin error:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || "Signin failed",
      };
    }
  };

  const signout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    navigate("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        signin,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
