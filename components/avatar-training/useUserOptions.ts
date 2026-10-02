// components/avatar-training/useUserOptions.ts
// Opções de utilizadores (formador/responsável) para os formulários de autoria.

import { useApiQuery } from '@/hooks/useApiQuery';
import { STALE_TIME } from '@/lib/queryClient';

export const NO_USER = 'NONE';

export function useUserOptions() {
  const query = useApiQuery<{ data: { id: number; fullName: string }[] }>(
    ['avatar-training', 'users-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return [
    { value: NO_USER, label: 'Eu próprio (por defeito)' },
    ...(query.data?.data ?? []).map((u) => ({
      value: String(u.id),
      label: u.fullName,
    })),
  ];
}
