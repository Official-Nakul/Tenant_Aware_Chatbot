import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();
const API_BASE_URL = "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const userData = response.data.user;
      const token = response.data.token;

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      setUser(userData);

      // Set default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true };
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

      const userData = response.data.user;
      const token = response.data.token;

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      setUser(userData);

      // Set default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true };
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
