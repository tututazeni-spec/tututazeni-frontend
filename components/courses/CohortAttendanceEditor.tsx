// components/courses/CohortAttendanceEditor.tsx
// Presenças de uma sessão: lista automática dos inscritos, estado por
// participante (Presente / Ausente / Atrasado / Justificado), horas e
// observação. Nada é assumido por omissão: quem não foi marcado fica "Sem
// registo". Alterações por guardar avisam antes de sair.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eraser, Save } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  MODALITY_LABEL,
  SESSION_STATUS,
  sessionDay,
} from './CohortSessionsPanel';
import { Skeleton } from './shared';
import type {
  AttendanceState,
  CohortSession,
  SessionAttendance,
} from './types';

export const ATTENDANCE_LABEL: Record<
  AttendanceState,
  { label: string; intent: 'success' | 'danger' | 'warning' | 'info' }
> = {
  PRESENT: { label: 'Presente', intent: 'success' },
  ABSENT: { label: 'Ausente', intent: 'danger' },
  LATE: { label: 'Atrasado', intent: 'warning' },
  JUSTIFIED: { label: 'Justificado', intent: 'info' },
};

interface Row {
  status: AttendanceState | '';
  checkInTime: string;
  checkOutTime: string;
  note: string;
}

const NONE = 'NONE';

export interface CohortAttendanceEditorProps {
  cohortId: number;
  sessions: CohortSession[];
  sessionId: number | null;
  onSessionChange: (id: number) => void;
  /** ADMIN/RH: pode limpar as marcações. */
  isPrivileged: boolean;
  /** O formador de uma turma alheia só consulta a sua sessão. */
  onDirtyChange?: (dirty: boolean) => void;
}

export function CohortAttendanceEditor({
  cohortId,
  sessions,
  sessionId,
  onSessionChange,
  isPrivileged,
  onDirtyChange,
}: CohortAttendanceEditorProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'status'>('name');
  const [reason, setReason] = useState('');

  const usable = sessions.filter((s) => s.status !== 'CANCELLED');
  const { data, isLoading } = useApiQuery<SessionAttendance>(
    queryKeys.courses.cohortSessionAttendance(cohortId, sessionId ?? 0),
    `/courses/cohorts/${cohortId}/sessions/${sessionId}/attendance`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: sessionId !== null },
  );

  // O rascunho parte do que já está gravado.
  useEffect(() => {
    if (!data) return;
    setRows(
      Object.fromEntries(
        data.participants.map((p) => [
          p.userId,
          {
            status: p.status ?? '',
            checkInTime: p.checkInTime ?? '',
            checkOutTime: p.checkOutTime ?? '',
            note: p.note ?? '',
          },
        ]),
      ),
    );
    setDirty(false);
    setReason('');
  }, [data]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // Aviso do navegador ao fechar/recarregar com alterações por guardar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const invalidateKeys = [
    queryKeys.courses.cohortSessions(cohortId),
    queryKeys.courses.cohortSessionAttendance(cohortId, sessionId ?? 0),
    queryKeys.courses.cohortAttendanceReport(cohortId),
  ];

  const save = useApiMutation(
    (records: Array<Record<string, unknown>>) =>
      apiClient.put(
        `/courses/cohorts/${cohortId}/sessions/${sessionId}/attendance`,
        { records, reason: reason.trim() || undefined },
      ),
    {
      invalidateKeys,
      onSuccess: () => {
        setDirty(false);
        toast({ title: 'Presenças guardadas', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const clear = useApiMutation(
    (why: string) =>
      apiClient.post(
        `/courses/cohorts/${cohortId}/sessions/${sessionId}/attendance/clear`,
        { reason: why },
      ),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Marcações da sessão limpas', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  function patch(userId: number, change: Partial<Row>) {
    setRows((c) => ({ ...c, [userId]: { ...c[userId], ...change } }));
    setDirty(true);
  }

  async function changeSession(id: number) {
    if (dirty) {
      const ok = await confirm({
        title: 'Descartar alterações por guardar?',
        message: 'Mudar de sessão perde as marcações que ainda não guardou.',
        confirmLabel: 'Descartar',
        destructive: true,
      });
      if (!ok) return;
    }
    onSessionChange(id);
  }

  function markAllPresent() {
    setRows((c) =>
      Object.fromEntries(
        Object.entries(c).map(([id, r]) => [id, { ...r, status: 'PRESENT' }]),
      ),
    );
    setDirty(true);
  }

  async function onClear() {
    if (!reason.trim()) {
      toast({
        title: 'Indique o motivo no campo "Motivo da alteração"',
        intent: 'danger',
      });
      return;
    }
    const ok = await confirm({
      title: 'Limpar as marcações desta sessão?',
      message: 'O histórico guarda o que existia e o motivo indicado.',
      confirmLabel: 'Limpar marcações',
      destructive: true,
    });
    if (ok) clear.mutate(reason.trim());
  }

  function handleSave() {
    const records = Object.entries(rows)
      .filter(([, r]) => r.status !== '')
      .map(([userId, r]) => ({
        userId: Number(userId),
        status: r.status,
        checkInTime: r.checkInTime || undefined,
        checkOutTime: r.checkOutTime || undefined,
        note: r.note.trim() || undefined,
      }));
    if (records.length === 0) {
      toast({ title: 'Marque pelo menos um participante', intent: 'danger' });
      return;
    }
    const bad = records.find(
      (r) => r.checkInTime && r.checkOutTime && r.checkOutTime < r.checkInTime,
    );
    if (bad) {
      toast({
        title: 'A hora de saída não pode ser anterior à de entrada',
        intent: 'danger',
      });
      return;
    }
    save.mutate(records);
  }

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LATE: 0, JUSTIFIED: 0, none: 0 };
    for (const r of Object.values(rows)) {
      if (r.status) c[r.status] += 1;
      else c.none += 1;
    }
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data?.participants ?? []).filter((p) => {
      const st = rows[p.userId]?.status ?? '';
      if (filter === NONE ? st !== '' : filter !== 'ALL' && st !== filter)
        return false;
      return (
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.identifier.toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) =>
      sortBy === 'status'
        ? (rows[a.userId]?.status ?? '').localeCompare(
            rows[b.userId]?.status ?? '',
          ) || a.fullName.localeCompare(b.fullName, 'pt')
        : a.fullName.localeCompare(b.fullName, 'pt'),
    );
  }, [data, rows, search, filter, sortBy]);

  if (usable.length === 0)
    return (
      <p className="text-sm text-ink-muted">
        Crie uma sessão no separador Sessões para registar presenças.
      </p>
    );

  const session = data?.session;
  const sessionBadge = session ? SESSION_STATUS[session.status] : null;

  return (
    <section className="space-y-4">
      <Select
        variant="underline"
        icon={CalendarDays}
        placeholder="Escolha uma sessão…"
        items={usable.map((s) => ({
          value: String(s.id),
          label: `${sessionDay(s.date)} · ${s.startTime}–${s.endTime} · ${s.title}`,
        }))}
        value={sessionId === null ? '' : String(sessionId)}
        onValueChange={(v) => void changeSession(Number(v))}
        className="w-full"
      />

      {sessionId === null ? (
        <p className="text-sm text-ink-muted">
          Escolha uma sessão para ver os participantes inscritos.
        </p>
      ) : isLoading || !data || !session ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-2 rounded-card border border-border p-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                Turma
              </div>
              {data.cohort.name}
              <div className="text-xs text-ink-muted">
                {data.cohort.courseTitle}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                Data e horário
              </div>
              {sessionDay(session.date)} · {session.startTime}–{session.endTime}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-faint">
                Formador · Modalidade
              </div>
              {session.instructor?.fullName ?? '—'} ·{' '}
              {MODALITY_LABEL[session.modality]}
              {sessionBadge && (
                <Badge intent={sessionBadge.intent} className="ml-2">
                  {sessionBadge.label}
                </Badge>
              )}
            </div>
          </div>

          {dirty && (
            <AlertCard
              variant="warning"
              compact
              title="Alterações por guardar"
              message="Clique em Guardar presenças antes de sair desta sessão."
            />
          )}

          <div
            className="flex flex-wrap gap-2 text-sm"
            aria-label="Indicadores da sessão"
          >
            <Badge intent="neutral">
              Inscritos: {data.participants.length}
            </Badge>
            <Badge intent="success">Presentes: {counts.PRESENT}</Badge>
            <Badge intent="danger">Ausentes: {counts.ABSENT}</Badge>
            <Badge intent="warning">Atrasados: {counts.LATE}</Badge>
            <Badge intent="info">Justificados: {counts.JUSTIFIED}</Badge>
            <Badge intent="neutral">Sem registo: {counts.none}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar nome ou identificador…"
              aria-label="Pesquisar participante"
              className="min-w-[14rem] flex-1"
            />
            <NativeSelect
              density="sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="ALL">Todos os estados</option>
              {Object.entries(ATTENDANCE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l.label}
                </option>
              ))}
              <option value={NONE}>Sem registo</option>
            </NativeSelect>
            <NativeSelect
              density="sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'status')}
              aria-label="Ordenar por"
            >
              <option value="name">Ordenar por nome</option>
              <option value="status">Ordenar por estado</option>
            </NativeSelect>
          </div>

          <div className="max-h-[26rem] overflow-auto">
            <Table>
              <TableHead className="bg-brand/60">
                <TableRow className="hover:bg-transparent">
                  <TableHeaderCell className="text-white">
                    Participante
                  </TableHeaderCell>
                  <TableHeaderCell className="text-white">
                    Estado
                  </TableHeaderCell>
                  <TableHeaderCell className="text-white">
                    Entrada
                  </TableHeaderCell>
                  <TableHeaderCell className="text-white">
                    Saída
                  </TableHeaderCell>
                  <TableHeaderCell className="text-white">
                    Observação
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-ink-muted">
                      Nenhum participante corresponde aos filtros.
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((p) => {
                  const r = rows[p.userId];
                  if (!r) return null;
                  return (
                    <TableRow key={p.userId}>
                      <TableCell>
                        <div className="text-ink">{p.fullName}</div>
                        <div className="text-xs text-ink-faint">
                          {p.identifier}
                        </div>
                      </TableCell>
                      <TableCell>
                        <NativeSelect
                          density="sm"
                          value={r.status}
                          aria-label={`Estado de ${p.fullName}`}
                          onChange={(e) =>
                            patch(p.userId, {
                              status: e.target.value as AttendanceState | '',
                            })
                          }
                        >
                          <option value="">Sem registo</option>
                          {Object.entries(ATTENDANCE_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l.label}
                            </option>
                          ))}
                        </NativeSelect>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={r.checkInTime}
                          aria-label={`Entrada de ${p.fullName}`}
                          onChange={(e) =>
                            patch(p.userId, { checkInTime: e.target.value })
                          }
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="time"
                          value={r.checkOutTime}
                          aria-label={`Saída de ${p.fullName}`}
                          onChange={(e) =>
                            patch(p.userId, { checkOutTime: e.target.value })
                          }
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.note}
                          maxLength={500}
                          placeholder="Nota ou justificação"
                          aria-label={`Observação de ${p.fullName}`}
                          onChange={(e) =>
                            patch(p.userId, { note: e.target.value })
                          }
                          className="min-w-[10rem]"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <label className="block space-y-1 text-xs text-ink-muted">
            Motivo da alteração (opcional; obrigatório para limpar)
            <Input
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              className="w-full"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button size="sm" intent="secondary" onClick={markAllPresent}>
                Marcar todos como presentes
              </Button>
              {isPrivileged && data.summary.enrolled > 0 && (
                <Button
                  size="sm"
                  intent="ghostDanger"
                  onClick={() => void onClear()}
                  loading={clear.isPending}
                >
                  <Eraser size={14} strokeWidth={1.75} className="mr-1" />
                  Limpar marcações da sessão
                </Button>
              )}
            </div>
            <Button size="sm" onClick={handleSave} loading={save.isPending}>
              <Save size={14} strokeWidth={1.75} className="mr-1" />
              Guardar presenças
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
