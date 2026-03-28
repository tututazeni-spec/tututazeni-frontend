"use client";
 
import { useUsers } from "../hooks/useUsers";
import UserCard from "../components/UserCard";
 
export default function Home() {
  const { users, loading, error } = useUsers();
 
  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        <p>A carregar utilizadores...</p>
      </main>
    );
  }
 
  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <p style={{ color: "red" }}>{error}</p>
      </main>
    );
  }
 
  return (
    <main style={{ padding: 40 }}>
      <h1>Utilizadores</h1>
 
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </main>
  );
}