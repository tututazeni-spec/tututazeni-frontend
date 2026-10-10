// components/departments/HeadcountCard.tsx
// Headcount previsto vs. actual vs. limite máximo de um departamento.
// Edição reservada a ADMIN/RH (o backend também restringe PUT /departments/:id).

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { QueryKey } from '@tanstack/react-query';

interface HeadcountCardProps {
  deptId: number;
  activeUsers: number;
  expected: number | null;
  max: number | null;
  invalidateKeys: QueryKey[];
}

const toNumberOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

export function HeadcountCard({
  deptId,
  activeUsers,
  expected,
  max,
  invalidateKeys,
}: HeadcountCardProps) {
  const notify = useToast();
  const me = useCurrentUser();
  const canEdit = ['ADMIN', 'RH'].includes(me.data?.role?.code ?? '');
  const [editing, setEditing] = useState(false);
  const [expectedInput, setExpectedInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const save = useApiMutation(
    () =>
      apiClient.put(`/departments/${deptId}`, {
        expectedEmployees: toNumberOrNull(expectedInput),
        maxEmployees: toNumberOrNull(maxInput),
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        notify({ title: 'Número de colaboradores actualizado', intent: 'success' });
        setEditing(false);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const startEdit = () => {
    setExpectedInput(expected != null ? String(expected) : '');
    setMaxInput(max != null ? String(max) : '');
    setEditing(true);
  };

  const full = max != null && activeUsers >= max;
  const gap = expected != null ? expected - activeUsers : null;

  return (
    <Card className="p-4">
      <div className="-mx-4 -mt-4 mb-3 rounded-t-[inherit] bg-[#0F1F3D]/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
        Número de colaboradores
      </div>
      {editing ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[160px] flex-1 text-xs text-ink-faint">
            Previsto
            <Input
              type="number"
              min={0}
              value={expectedInput}
              onChange={(e) => setExpectedInput(e.target.value)}
              placeholder="Sem previsão"
            />
          </label>
          <label className="min-w-[160px] flex-1 text-xs text-ink-faint">
            Limite máximo
            <Input
              type="number"
              min={0}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="Sem limite"
            />
          </label>
          <Button
            onClick={() => save.mutate(undefined)}
            loading={save.isPending}
            disabled={save.isPending}
          >
            Guardar
          </Button>
          <Button intent="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-ink-faint">
              Actual: <strong className="text-ink">{activeUsers}</strong>
            </span>
            <span className="text-ink-faint">
              Previsto:{' '}
              <strong className="text-ink">{expected ?? '—'}</strong>
              {gap != null && gap !== 0 && (
                <span className="ml-1 text-xs">
                  ({gap > 0 ? `faltam ${gap}` : `${-gap} acima`})
                </span>
              )}
            </span>
            <span className="text-ink-faint">
              Limite: <strong className="text-ink">{max ?? '—'}</strong>
              {full && (
                <span className="ml-1 text-xs text-danger">(atingido)</span>
              )}
            </span>
          </div>
          {canEdit && (
            <Button intent="secondary" size="sm" onClick={startEdit}>
              Definir número de colaboradores
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
