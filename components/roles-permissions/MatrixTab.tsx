// components/roles-permissions/MatrixTab.tsx
// Tab "Matriz": tabela role × permissão filtrável por subject.
// Extraído de app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { MatrixData } from './types';

export function MatrixTab() {
  const [subject, setSubject] = useState('');
  const { data, isLoading: loading } = useApiQuery<MatrixData>(
    queryKeys.rolesPermissions.matrix(),
    '/roles-permissions/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const subjects = (data?.grouped ?? []).map((g) => g.subject);
  const filtered = subject
    ? (data?.permissions ?? []).filter((p) => p.subject === subject)
    : (data?.permissions ?? []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          intent={!subject ? 'primary' : 'secondary'}
          onClick={() => setSubject('')}
        >
          Todos
        </Button>
        {subjects.map((s: string) => (
          <Button
            key={s}
            size="sm"
            intent={subject === s ? 'primary' : 'secondary'}
            onClick={() => setSubject(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Permissão</TableHeaderCell>
            {(data?.roles ?? []).map((r) => (
              <TableHeaderCell
                key={r.id}
                className="text-center whitespace-nowrap"
              >
                {r.name}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((p, i) => (
            <TableRow key={i}>
              <TableCell>
                <p className="font-data text-ink">{p.name}</p>
                <p className="text-[10px] text-ink-faint">
                  {p.subject} · {p.action}
                </p>
              </TableCell>
              {(data?.roles ?? []).map((r) => (
                <TableCell key={r.id} className="text-center">
                  {data?.matrix?.[i]?.[r.name] ? (
                    <CheckCircle
                      size={14}
                      strokeWidth={1.75}
                      className="text-success mx-auto"
                    />
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
