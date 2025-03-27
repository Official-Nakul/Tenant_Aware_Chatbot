import axios from "axios";

const api = axios.create({
  baseURL: "/",
  withCredentials: true,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      config.headers.Authorization = `Bearer ${user.id}`; // In a real app, you would use a JWT token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
