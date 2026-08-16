// components/acl/MatrixTab.tsx

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { AclMatrixData } from './types';

export function MatrixTab() {
  const [subjectFilter, setSubjectFilter] = useState('');
  const { data, isLoading: loading } = useApiQuery<AclMatrixData>(
    queryKeys.acl.matrix(),
    '/acl/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  const subjects: string[] = [
    ...new Set<string>((data?.permissions ?? []).map((p) => String(p.subject))),
  ];
  const filtered = (data?.permissions ?? []).filter(
    (p) => !subjectFilter || p.subject === subjectFilter,
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          intent={!subjectFilter ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSubjectFilter('')}
        >
          Todos
        </Button>
        {subjects.map((s) => (
          <Button
            key={s}
            intent={subjectFilter === s ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSubjectFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Matrix table */}
      <Card className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-surface-sunken">
            <tr>
              <th className="px-3 py-2 font-medium text-left text-ink-muted whitespace-nowrap">
                Permissão
              </th>
              {(data?.roles ?? []).map((r) => (
                <th
                  key={r.id}
                  className="px-2 py-2 font-medium text-center text-ink-muted whitespace-nowrap"
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p, i) => (
              <tr key={i} className="hover:bg-surface">
                <td className="px-3 py-1.5">
                  <div>
                    <p className="font-mono text-ink">{p.name}</p>
                    <p className="text-ink-faint text-[10px]">
                      {p.subject} · {p.action}
                    </p>
                  </div>
                </td>
                {(data?.roles ?? []).map((r) => (
                  <td key={r.id} className="px-2 py-1.5 text-center">
                    {data?.matrix[i]?.[r.name] ? (
                      <CheckCircle
                        size={14}
                        strokeWidth={1.75}
                        className="mx-auto text-success"
                      />
                    ) : (
                      <span className="text-border">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
