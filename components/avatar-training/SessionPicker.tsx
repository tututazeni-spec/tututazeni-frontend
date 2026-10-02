// components/avatar-training/SessionPicker.tsx
// Selector de sessão partilhado pelas abas de autoria (Construtor, Base de
// Conhecimento, Avaliações). Autores vêem todas as sessões, em qualquer estado.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import type { SessionDetail, SessionListItem } from './types';

export function useSessionList() {
  return useApiQuery<SessionListItem[]>(
    queryKeys.avatarTraining.sessions(),
    '/avatar-training/sessions',
    { staleTime: STALE_TIME.DYNAMIC },
  );
}

export function useSessionDetail(id: number | null) {
  return useApiQuery<SessionDetail>(
    queryKeys.avatarTraining.session(id ?? 0),
    `/avatar-training/sessions/${id}`,
    { enabled: id !== null, staleTime: 0 },
  );
}

export function SessionPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const { data, error, refetch } = useSessionList();
  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  return (
    <Select
      className="w-full max-w-md"
      placeholder={data ? 'Escolha uma sessão' : 'A carregar sessões…'}
      value={value === null ? undefined : String(value)}
      onValueChange={(v) => onChange(Number(v))}
      items={(data ?? []).map((s) => ({
        value: String(s.id),
        label: `${s.program.title} — ${s.title}`,
      }))}
    />
  );
}
