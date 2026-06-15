import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Instância axios partilhada. Autenticação por cookie httpOnly:
// `withCredentials` envia o cookie automaticamente; o token nunca é lido em JS.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

// Logout automático quando a sessão expira (401).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
