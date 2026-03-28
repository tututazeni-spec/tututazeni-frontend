import { User } from '../types/user';
 
interface UserCardProps {
  user: User;
}
 
export default function UserCard({ user }: UserCardProps) {
  return (
    <div className="p-4 border rounded mb-2">
      <h2 className="text-lg font-semibold">{user.fullName}</h2>
      <p className="text-sm text-gray-500">{user.email}</p>
    </div>
  );
}