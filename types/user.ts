export type User = {
  id: number;
  fullName: string; // ✅ igual ao schema Prisma
  email: string;
  createdAt?: string;
};