// components/live-classes/AttendanceView.tsx
// Separador "Presenças" (docs/aulas-ao-vivo.md secção 10) — auditoria de
// presença (Entrada/Saída/Justificação) sobre a mesma tabela LiveAttendance
// que ParticipantsView.tsx (secção 6) usa para o roster de inscrições; aqui
// a ênfase é a data/hora efectiva e a justificação, não o departamento/curso.
// O cálculo de 100%/75%/50%/ausência e o alimentar do progresso do curso
// corre no backend (live-classes.service.ts#deriveAttendance /
// #maybeSyncCourseProgress) sempre que uma presença é registada/actualizada.

'use client';

import { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { LIVE_ATTENDANCE_STATUS_CFG } from './constants';
import type { LiveAttendanceStatus, LiveParticipant, PaginatedMeta } from './types';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...(Object.keys(LIVE_ATTENDANCE_STATUS_CFG) as LiveAttendanceStatus[]).map((s) => ({
    value: s,
    label: LIVE_ATTENDANCE_STATUS_CFG[s].label,
  })),
];

function useLiveClassOptions() {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; topic: string }[] }>(
    queryKeys.liveClasses.list({ picker: 'attendance', ...params }),
    '/live-classes',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (query.data?.data ?? []).map((c) => ({ value: String(c.id), label: c.topic }));
}

export function AttendanceView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const liveClassOptions = useLiveClassOptions();

  const [liveClassId, setLiveClassId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [registering, setRegistering] = useState<LiveParticipant | null>(null);
  const [registerForm, setRegisterForm] = useState({ joinedAt: '', leftAt: '' });
  const [justifying, setJustifying] = useState<LiveParticipant | null>(null);
  const [justification, setJustification] = useState('');

  const params: Record<string, string | number | undefined> = { page, limit: 20 };
  if (liveClassId !== 'ALL') params.liveClassId = Number(liveClassId);
  if (status !== 'ALL') params.status = status;
  if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
  if (dateTo) params.dateTo = new Date(dateTo).toISOString();

  const { data, isLoading } = useApiQuery<PaginatedMeta<LiveParticipant>>(
    queryKeys.liveClasses.participants({ view: 'attendance', ...params }),
    '/live-classes/participants',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const invalidateKeys = [queryKeys.liveClasses.all];

  const register = useApiMutation(
    () =>
      apiClient.put(`/live-classes/${registering!.liveClassId}/attendance/${registering!.id}`, {
        joinedAt: registerForm.joinedAt ? new Date(registerForm.joinedAt).toISOString() : undefined,
        leftAt: registerForm.leftAt ? new Date(registerForm.leftAt).toISOString() : undefined,
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Presença registada — progresso do curso actualizado se aplicável.', intent: 'success' });
        setRegistering(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const justify = useApiMutation(
    () =>
      apiClient.put(`/live-classes/${justifying!.liveClassId}/attendance/${justifying!.id}`, {
        status: 'JUSTIFICADO',
        justification,
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Ausência justificada.', intent: 'success' });
        setJustifying(null);
        setJustification('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  function openRegister(p: LiveParticipant) {
    setRegisterForm({
      joinedAt: p.joinedAt ? p.joinedAt.slice(0, 16) : '',
      leftAt: p.leftAt ? p.leftAt.slice(0, 16) : '',
    });
    setRegistering(p);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Combobox
          items={[{ value: 'ALL', label: 'Todas as aulas' }, ...liveClassOptions]}
          value={liveClassId}
          onValueChange={(v) => {
            setLiveClassId(v);
            setPage(1);
          }}
          className="w-56"
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="w-48"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem registos de presença"
          description="As presenças aparecem aqui assim que os participantes entram numa aula ou a presença é registada manualmente."
        />
      ) : (
        <>
          <Card className="divide-y divide-border">
            {rows.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={p.user.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{p.user.fullName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                    <span>{p.liveClass.topic}</span>
                    {p.session && <span>· Sessão {p.session.seq}</span>}
                    <span>· Entrada: {p.joinedAt ? formatDateTime(p.joinedAt) : '—'}</span>
                    <span>· Saída: {p.leftAt ? formatDateTime(p.leftAt) : '—'}</span>
                    {p.durationMinutes != null && <span>· {p.durationMinutes}min ({p.attendancePercent ?? 0}%)</span>}
                  </div>
                  {p.justification && (
                    <div className="mt-0.5 flex items-center gap-1 font-body text-xs text-info">
                      <FileText size={11} strokeWidth={1.75} /> {p.justification}
                    </div>
                  )}
                </div>
                <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${LIVE_ATTENDANCE_STATUS_CFG[p.computedStatus]?.cls ?? ''}`}>
                  {LIVE_ATTENDANCE_STATUS_CFG[p.computedStatus]?.label ?? p.computedStatus}
                </span>
                {canManage && (
                  <div className="flex gap-2">
                    <Button intent="ghost" size="sm" onClick={() => openRegister(p)}>
                      <CheckCircle2 size={14} strokeWidth={1.75} />
                      Registar
                    </Button>
                    <Button
                      intent="ghost"
                      size="sm"
                      onClick={() => {
                        setJustifying(p);
                        setJustification(p.justification ?? '');
                      }}
                    >
                      Justificar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button intent="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <span className="py-2 px-3 text-sm text-ink-muted">
                {page} / {totalPages}
              </span>
              <Button intent="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Seguinte →
              </Button>
            </div>
          )}
        </>
      )}

      {registering && (
        <Modal open onOpenChange={(open) => !open && setRegistering(null)}>
          <ModalContent title={`Registar presença — ${registering.user.fullName}`}>
            <div className="mt-4 space-y-4">
              <FormField label="Entrada" htmlFor="av-joinedAt">
                <Input
                  id="av-joinedAt"
                  type="datetime-local"
                  value={registerForm.joinedAt}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, joinedAt: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Saída" htmlFor="av-leftAt">
                <Input
                  id="av-leftAt"
                  type="datetime-local"
                  value={registerForm.leftAt}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, leftAt: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <p className="font-body text-xs text-ink-faint">
                O estado (Presente/Atrasado/Parcial/Ausente) e a percentagem são calculados automaticamente a partir
                destes horários e da regra de presença mínima da aula ({registering.liveClass.duration}min).
              </p>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setRegistering(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 justify-center" onClick={() => register.mutate(undefined)} loading={register.isPending}>
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {justifying && (
        <Modal open onOpenChange={(open) => !open && setJustifying(null)}>
          <ModalContent title={`Justificar ausência — ${justifying.user.fullName}`}>
            <div className="mt-4">
              <FormField label="Justificação" htmlFor="av-justification">
                <Textarea
                  id="av-justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setJustifying(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => justify.mutate(undefined)}
                loading={justify.isPending}
                disabled={!justification.trim()}
              >
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
