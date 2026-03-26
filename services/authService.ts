import api from './api'; // ✅ importa o axios já configurado

// Tipos
interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

// Login
export const login = async (payload: LoginPayload) => {
  const response = await api.post('/auth/login', payload);
  return response.data;
};

// Registo
export const register = async (payload: RegisterPayload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

// Logout
export const logout = () => {
  localStorage.removeItem('authToken');
};

// Guardar token após login
export const saveToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Obter token
export const getToken = () => {
  return localStorage.getItem('authToken');
};