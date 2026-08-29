// components/leadership/MyDashboardView.tsx
// Separador "O meu painel" — score, programas, 1:1s e kudos. Dados
// próprios (useApiQuery/useApiMutation) + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.
//
// O ProgressBar da fundação é mono-cor (bg-accent) — a cor que aqui
// comunicava "concluído" passa para o texto de estado (statusTextClass).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { CLASS_CFG, LEVEL_CFG } from './constants';
import type {
  KudosItem,
  LeadershipScore,
  MyDashboardData,
  OneOnOne,
  ProgramLevel,
} from './types';

function statusTextClass(status: string): string {
  return status === 'COMPLETED' ? 'text-success-ink' : 'text-ink-faint';
}

export function MyDashboardView() {
  const notify = useToast();
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTarget, setKudosTarget] = useState('');

  const { data, isLoading } = useApiQuery<MyDashboardData>(
    queryKeys.leadership.myDashboard(),
    '/leadership/my/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const kudosMutation = useApiMutation(
    () =>
      apiClient.post('/leadership/kudos', {
        receiverId: parseInt(kudosTarget),
        message: kudosMsg,
      }),
    {
      onSuccess: () => {
        setKudosMsg('');
        setKudosTarget('');
        notify({ title: 'Kudos enviados!', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const sendingKudos = kudosMutation.isPending;
  const handleKudos = () => {
    if (kudosMsg && kudosTarget) kudosMutation.mutate(undefined);
  };

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const score: LeadershipScore | null = data.score;
  const classCfg = score
    ? (CLASS_CFG[score.classification] ?? CLASS_CFG.AVERAGE)
    : null;

  return (
    <div className="space-y-6">
      {/* Score card */}
      {score && (
        <div className="flex items-center justify-between rounded-panel bg-gradient-to-r from-primary to-primary-active p-6 text-canvas shadow-resting">
          <div>
            <div className="mb-1 font-body text-sm text-canvas/70">
              Leadership Score
            </div>
            <div className="font-mono text-5xl font-bold">{score.score}</div>
            <div className="mt-1 font-body text-sm text-canvas/70">
              de 1000 pontos
            </div>
          </div>
          <div className="text-right">
            {classCfg && (
              <span className="inline-block rounded-control bg-canvas/20 px-3 py-1.5 font-body text-sm font-medium">
                {classCfg.label}
              </span>
            )}
            <div className="mt-2 font-body text-xs text-canvas/70">
              Actualizado {fmtDate(score.calculatedAt)}
            </div>
          </div>
        </div>
      )}

      {!score && (
        <div className="rounded-card border border-dashed border-border-strong bg-surface-sunken p-6 text-center font-body text-sm text-ink-faint">
          Sem Pontuação de Liderança calculado ainda
        </div>
      )}

      {/* Grid: programas + 1:1s */}
      <div className="grid grid-cols-2 gap-5">
        {/* Programas */}
        <div>
          <div className="mb-3 font-body text-sm font-semibold text-ink">
            Os meus programas
          </div>
          <div className="space-y-2">
            {data.programs?.slice(0, 4).map((p) => (
              <Card key={p.id} className="p-4">
                <div className="mb-1 flex items-center justify-between">
                  <div className="truncate font-body text-xs font-medium text-ink">
                    {p.program?.name}
                  </div>
                  <StatusBadge
                    value={p.program?.level as ProgramLevel}
                    map={LEVEL_CFG}
                  />
                </div>
                <ProgressBar value={p.progress} />
                <div
                  className={`mt-1 font-body text-xs font-medium ${statusTextClass(p.status)}`}
                >
                  {p.status}
                </div>
              </Card>
            ))}
            {(!data.programs || data.programs.length === 0) && (
              <div className="rounded-card border border-dashed border-border-strong py-4 text-center font-body text-xs text-ink-faint">
                Sem programas inscritos
              </div>
            )}
          </div>
        </div>

        {/* 1:1s próximos */}
        <div>
          <div className="mb-3 font-body text-sm font-semibold text-ink">
            Próximos 1:1s
          </div>
          <div className="space-y-2">
            {data.upcoming1on1s?.map((m: OneOnOne) => (
              <Card key={m.id} className="flex items-center gap-3 p-4">
                <Avatar
                  name={m.subordinate.fullName}
                  url={m.subordinate.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-xs font-medium text-ink">
                    {m.subordinate.fullName}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    {fmtDate(m.scheduledAt)} · {m.durationMinutes}min
                  </div>
                </div>
                {m.meetingUrl && (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 font-body text-xs text-primary hover:underline"
                  >
                    Entrar
                  </a>
                )}
              </Card>
            ))}
            {(!data.upcoming1on1s || data.upcoming1on1s.length === 0) && (
              <div className="rounded-card border border-dashed border-border-strong py-4 text-center font-body text-xs text-ink-faint">
                Sem 1:1s agendados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kudos recebidos + enviar */}
      <div>
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          Reconhecimentos recebidos
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {data.recentKudos?.slice(0, 5).map((k: KudosItem) => (
              <div
                key={k.id}
                className="rounded-card border border-warning bg-warning-subtle p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{k.badge ?? '⭐'}</span>
                  <span className="font-body text-xs font-medium text-warning-ink">
                    {k.sender.fullName}
                  </span>
                  <span className="ml-auto font-body text-xs text-warning-ink/70">
                    {fmtDate(k.createdAt)}
                  </span>
                </div>
                <p className="font-body text-xs text-warning-ink">
                  {k.message}
                </p>
              </div>
            ))}
            {(!data.recentKudos || data.recentKudos.length === 0) && (
              <div className="rounded-card border border-dashed border-border-strong py-4 text-center font-body text-xs text-ink-faint">
                Sem Reconhecimentos recebidos ainda
              </div>
            )}
          </div>

          {/* Enviar kudos */}
          <div className="rounded-card border border-dashed border-border-strong p-4">
            <div className="mb-3 font-body text-xs font-medium text-ink-muted">
              Dar reconhecimento a colega
            </div>
            <Input
              type="number"
              placeholder="ID do colega"
              value={kudosTarget}
              onChange={(e) => setKudosTarget(e.target.value)}
              className="mb-2 w-full"
            />
            <Textarea
              placeholder="Escreve uma mensagem de reconhecimento…"
              value={kudosMsg}
              onChange={(e) => setKudosMsg(e.target.value)}
              rows={3}
              className="mb-2 w-full resize-none"
            />
            <Button
              onClick={handleKudos}
              disabled={!kudosMsg || !kudosTarget || sendingKudos}
              loading={sendingKudos}
              intent="warning"
              size="sm"
              className="w-full"
            >
              {sendingKudos ? 'A enviar…' : ' Enviar Reconhecimento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
