"use client";

import { useApiQuery } from "../hooks/useApiQuery";
import { queryKeys } from "../lib/queryKeys";
import UserCard from "../components/UserCard";
import type { User } from "../types/user";

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Lista fixa (não paginada) — esta página é só uma vitrine simples; a listagem
// completa com filtros/paginação vive em app/(platform)/users.
const PARAMS = { page: 1, limit: 50 };

export default function Home() {
  const { data, isLoading, error } = useApiQuery<PaginatedUsers>(
    queryKeys.users.list(PARAMS),
    "/users",
    { params: PARAMS },
  );

  if (isLoading) {
    return (
      <main style={{ padding: 40 }}>
        <p>A carregar utilizadores...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <p style={{ color: "red" }}>{error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Utilizadores</h1>

      {data?.data.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </main>
  );
}
