import axios, { InternalAxiosRequestConfig } from "axios";
 
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
 
const api = axios.create({
  baseURL: API_URL,
});
 
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    config.headers = config.headers ?? {};
 
    // Verifica se está no browser antes de aceder ao localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken") ?? "";
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
 
    config.headers["Accept"] = "application/json";
 
    return config;
  },
  (error) => Promise.reject(error)
);
 
export default api;