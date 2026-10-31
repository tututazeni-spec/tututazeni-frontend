// components/courses/CohortAttendancePanel.tsx
// Controlo diário de presenças de uma turma: escolhe-se um dia de aula, marca-se
// quem esteve (Presente / Falta) e a folha mostra todos os dias × participantes,
// com o total de presenças de cada um. Quem ainda não foi marcado fica "Sem
// registo" — nunca se assume presença por omissão.

'use client';

import { useEffect, useState } from 'react';
import { Check, Download, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { downloadFromApi } from '@/lib/download';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PeriodPills } from '@/components/ui/Pills';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { CohortAttendanceSheet } from './types';

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** "02/11" a partir de YYYY-MM-DD (sem fuso: os dias de aula são datas de calendário). */
function shortDay(iso: string) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function weekday(iso: string) {
  return WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

type Mark = 'PRESENT' | 'ABSENT' | undefined;

function MarkIcon({ status }: { status: string | undefined }) {
  if (status === 'PRESENT')
    return (
      <Check
        size={14}
        strokeWidth={2}
        className="mx-auto text-success-ink"
        aria-label="Presente"
      />
    );
  if (status === 'ABSENT')
    return (
      <X
        size={14}
        strokeWidth={2}
        className="mx-auto text-danger-ink"
        aria-label="Falta"
      />
    );
  return <span className="text-ink-faint">–</span>;
}

export function CohortAttendancePanel({ cohortId }: { cohortId: number }) {
  const toast = useToast();
  const [day, setDay] = useState<string>('');
  const [draft, setDraft] = useState<Record<number, Mark>>({});
  const [exporting, setExporting] = useState(false);

  const { data: sheet } = useApiQuery<CohortAttendanceSheet>(
    queryKeys.courses.cohortAttendanceSheet(cohortId),
    `/courses/cohorts/${cohortId}/attendance/sheet`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  // Dia inicial: hoje se for dia de aula; senão o último já passado (ou o primeiro).
  useEffect(() => {
    if (!sheet || day || sheet.days.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const past = sheet.days.filter((d) => d <= today);
    setDay(
      sheet.days.includes(today)
        ? today
        : (past[past.length - 1] ?? sheet.days[0]),
    );
  }, [sheet, day]);

  // O rascunho parte do que já está gravado nesse dia.
  useEffect(() => {
    if (!sheet || !day) return;
    const initial: Record<number, Mark> = {};
    for (const p of sheet.participants) {
      const s = p.marks[day];
      initial[p.userId] =
        s === 'PRESENT' ? 'PRESENT' : s === 'ABSENT' ? 'ABSENT' : undefined;
    }
    setDraft(initial);
  }, [sheet, day]);

  const save = useApiMutation(
    (records: Array<{ userId: number; present: boolean }>) =>
      apiClient.post(`/courses/cohorts/${cohortId}/attendance`, {
        date: day,
        records,
      }),
    {
      invalidateKeys: [queryKeys.courses.cohortAttendanceSheet(cohortId)],
      onSuccess: () =>
        toast({ title: 'Presenças guardadas', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function exportSheet(format: 'xlsx' | 'pdf') {
    setExporting(true);
    try {
      await downloadFromApi(`/courses/cohorts/${cohortId}/attendance/export`, {
        params: { format },
        fallbackName: `presencas.${format}`,
      });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Não foi possível exportar.',
        intent: 'danger',
      });
    } finally {
      setExporting(false);
    }
  }

  if (!sheet) return null;
  if (sheet.participants.length === 0) return null;

  if (sheet.days.length === 0)
    return (
      <section>
        <h3 className="mb-2 text-sm font-medium text-ink">Presenças</h3>
        <p className="text-sm text-ink-muted">
          A turma não tem dias de aula definidos.
        </p>
      </section>
    );

  const markedCount = Object.values(draft).filter(Boolean).length;

  function handleSave() {
    const records = Object.entries(draft)
      .filter(([, m]) => m !== undefined)
      .map(([userId, m]) => ({
        userId: Number(userId),
        present: m === 'PRESENT',
      }));
    if (records.length > 0) save.mutate(records);
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-ink">Presenças</h3>

      <div className="overflow-x-auto pb-1">
        <PeriodPills
          label="Dia de aula"
          value={day}
          onChange={setDay}
          options={sheet.days.map((d) => ({
            value: d,
            label: `${weekday(d)} ${shortDay(d)}`,
          }))}
        />
      </div>

      <div className="divide-y divide-border rounded-card border border-border">
        {sheet.participants.map((p) => {
          const mark = draft[p.userId];
          return (
            <div key={p.userId} className="flex items-center gap-3 px-3 py-2">
              <Avatar
                name={p.fullName}
                url={p.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1 truncate text-sm text-ink">
                {p.fullName}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  intent={mark === 'PRESENT' ? 'success' : 'ghost'}
                  aria-pressed={mark === 'PRESENT'}
                  onClick={() =>
                    setDraft((c) => ({ ...c, [p.userId]: 'PRESENT' }))
                  }
                >
                  Presente
                </Button>
                <Button
                  type="button"
                  size="sm"
                  intent={mark === 'ABSENT' ? 'danger' : 'ghost'}
                  aria-pressed={mark === 'ABSENT'}
                  onClick={() =>
                    setDraft((c) => ({ ...c, [p.userId]: 'ABSENT' }))
                  }
                >
                  Falta
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          intent="secondary"
          onClick={() =>
            setDraft(
              Object.fromEntries(
                sheet.participants.map((p) => [p.userId, 'PRESENT' as Mark]),
              ),
            )
          }
        >
          Todos presentes
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          loading={save.isPending}
          disabled={markedCount === 0}
        >
          Guardar presenças
        </Button>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-ink">Folha de presenças</h4>
          <div className="flex gap-2" role="group" aria-label="Exportar">
            <Button
              size="sm"
              intent="secondary"
              disabled={exporting}
              onClick={() => void exportSheet('xlsx')}
            >
              <Download size={14} strokeWidth={1.75} />
              Exportar Excel
            </Button>
            <Button
              size="sm"
              intent="secondary"
              disabled={exporting}
              onClick={() => void exportSheet('pdf')}
            >
              <Download size={14} strokeWidth={1.75} />
              Exportar PDF
            </Button>
          </div>
        </div>
        <Table>
          <TableHead className="bg-brand/60 [&_th]:text-white">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell>Participante</TableHeaderCell>
              {sheet.days.map((d) => (
                <TableHeaderCell key={d} className="px-2 text-center">
                  <div>{shortDay(d)}</div>
                  <div className="font-normal normal-case">{weekday(d)}</div>
                </TableHeaderCell>
              ))}
              <TableHeaderCell className="text-center">
                Presenças
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sheet.participants.map((p) => (
              <TableRow key={p.userId}>
                <TableCell>{p.fullName}</TableCell>
                {sheet.days.map((d) => (
                  <TableCell key={d} className="px-2 text-center">
                    <MarkIcon status={p.marks[d]} />
                  </TableCell>
                ))}
                <TableCell className="text-center font-medium tabular-nums">
                  {p.present}/{p.total}
                  {p.absent > 0 && (
                    <span className="ml-1 font-normal text-danger-ink">
                      ({p.absent} falta{p.absent > 1 ? 's' : ''})
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
