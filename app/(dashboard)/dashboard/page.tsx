"use client";
 
import { useUsers } from "../../../hooks/useUsers";
 
export default function DashboardPage() {
  const { users, loading, error } = useUsers();
 
  if (loading) {
    return <p>A carregar utilizadores...</p>;
  }
 
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
 
  return (
    <main className="p-8">
      <h1 className="text-xl font-bold mb-4">Utilizadores</h1>
 
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.fullName} - {user.email}
          </li>
        ))}
      </ul>
    </main>
  );
}