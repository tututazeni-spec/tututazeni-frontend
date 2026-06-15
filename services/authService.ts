import api from './api'; // axios com withCredentials (cookie httpOnly)
import { logout as cookieLogout } from '../lib/auth';

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

// Login — o backend define o cookie httpOnly 'token'. O JS nunca guarda o token.
export const login = async (payload: LoginPayload) => {
  const response = await api.post('/auth/login', payload);
  return response.data;
};

// Registo
export const register = async (payload: RegisterPayload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

// Logout — pede ao backend para limpar o cookie e redirecciona para o login.
export const logout = () => cookieLogout();
