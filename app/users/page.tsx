"use client";
 
import { useUsers } from "../../hooks/useUsers";
 
export default function UsersPage() {
  const { users, loading, error } = useUsers();
 
  if (loading) {
    return (
      <div className="p-10">
        <p>A carregar utilizadores...</p>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="p-10">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
 
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Lista de Utilizadores</h1>
 
      {users.length === 0 ? (
        <p>Nenhum utilizador encontrado.</p>
      ) : (
        users.map((user) => (
          <div key={user.id} className="p-4 border rounded mb-2">
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        ))
      )}
    </div>
  );
}
 