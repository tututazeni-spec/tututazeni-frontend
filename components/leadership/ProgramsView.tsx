// components/leadership/ProgramsView.tsx
// Separador "Programas" — listagem filtrável de programas de liderança
// com auto-inscrição. Dados próprios + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.

'use client';

import { Users, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { isRoleAllowed, type Role } from '@/lib/roles';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LEVEL_CFG, PROGRAM_MANAGER_ROLES } from './constants';
import { ProgramWizard } from './ProgramWizard';
import type { LeadershipProgram, ProgramLevel } from './types';

export interface ProgramsViewProps {
  /** Quando definido, cada cartão ganha "Gerir" que abre o workspace do programa. */
  onOpenWorkspace?: (programId: number) => void;
}

export function ProgramsView({ onOpenWorkspace }: ProgramsViewProps) {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const [filter, setFilter] = useState<ProgramLevel | ''>('');
  const [showWizard, setShowWizard] = useState(false);

  const isManager = isRoleAllowed(PROGRAM_MANAGER_ROLES, me?.role?.name as Role | undefined);

  const params = { status: 'ACTIVE', ...(filter ? { level: filter } : {}) };
  const { data, isLoading } = useApiQuery<{ data: LeadershipProgram[] }>(
    queryKeys.leadership.programs(filter),
    '/leadership/programs',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const handleEnroll = async (programId: number) => {
    try {
      await apiClient.post(`/leadership/programs/${programId}/self-enroll`, {});
      notify({ title: 'Inscrito com sucesso!', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'ProgramsView.handleEnroll' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        {(['', 'INITIAL', 'INTERMEDIATE', 'ADVANCED'] as const).map((l) => (
          <Button
            key={l}
            size="sm"
            intent={filter === l ? 'primary' : 'ghost'}
            onClick={() => setFilter(l)}
          >
            {l === '' ? 'Todos' : LEVEL_CFG[l as ProgramLevel].label}
          </Button>
        ))}
        {isManager && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setShowWizard(true)}
          >
            Criar programa
          </Button>
        )}
      </div>

      {showWizard && (
        <ProgramWizard
          onClose={() => setShowWizard(false)}
          onSuccess={() =>
            notify({ title: 'Programa criado', intent: 'success' })
          }
        />
      )}

      <div className="grid grid-cols-3 gap-4">
        {data?.data.map((prog) => (
          <Card key={prog.id} className="p-5 transition-all hover:shadow-hover">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 font-body text-sm font-semibold text-ink">
                  {prog.name}
                </div>
                <StatusBadge value={prog.level} map={LEVEL_CFG} />
              </div>
              {prog.mandatory && (
                <Badge intent="danger" className="flex-shrink-0">
                  Obrigatório
                </Badge>
              )}
            </div>

            {prog.description && (
              <p className="mb-3 line-clamp-2 font-body text-xs text-ink-muted">
                {prog.description}
              </p>
            )}

            <div className="mb-4 flex items-center justify-between font-body text-xs text-ink-faint">
              <span className="inline-flex items-center gap-1">
                <Users size={12} strokeWidth={1.75} />{' '}
                {prog._count.participants} participantes
              </span>
              {prog.durationWeeks && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} strokeWidth={1.75} /> {prog.durationWeeks}{' '}
                  semanas
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleEnroll(prog.id)}
              >
                Inscrever-me
              </Button>
              {isManager && onOpenWorkspace && (
                <Button
                  size="sm"
                  intent="secondary"
                  onClick={() => onOpenWorkspace(prog.id)}
                >
                  Gerir
                </Button>
              )}
            </div>
          </Card>
        ))}
        {data?.data.length === 0 && (
          <div className="col-span-3 rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
            Sem programas disponíveis
          </div>
        )}
      </div>
    </div>
  );
}
