import { getUsers } from '../services/userService';
import UserCard from '../components/UserCard';
import { User } from '../types/user';

export default async function Home() {
  const users: User[] = await getUsers();

  return (
    <main style={{ padding: 40 }}>
      <h1>Utilizadores</h1>

      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </main>
  );
}