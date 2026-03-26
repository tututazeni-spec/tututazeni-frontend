import axios, { InternalAxiosRequestConfig } from "axios";
import { API_URL } from '@/lib/api';

const api = axios.create({
  baseURL: API_URL, // ✅ usa a variável de ambiente
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    config.headers = config.headers ?? {};

    // Pega o token do localStorage
    const token = localStorage.getItem("authToken") ?? "";

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    config.headers["Accept"] = "application/json";

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;