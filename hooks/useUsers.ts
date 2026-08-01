import { useEffect, useState } from 'react';
import { getUsers } from '../services/userService'; // ✅ usa o serviço centralizado
import { User } from '../types/user';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Erro ao buscar utilizadores:', err);
        setError('Erro ao carregar utilizadores');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading, error };
}