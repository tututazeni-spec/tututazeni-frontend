import api from './api'; // ✅ axios centralizado com token automático
import { User } from '../types/user';

// Buscar todos os utilizadores
export async function getUsers(): Promise<User[]> {
  const response = await api.get('/users');
  return response.data;
}

// Buscar utilizador por ID
export async function getUserById(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// Criar utilizador
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const response = await api.post('/users', user);
  return response.data;
}

// Actualizar utilizador
export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const response = await api.put(`/users/${id}`, user);
  return response.data;
}

// Eliminar utilizador
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}