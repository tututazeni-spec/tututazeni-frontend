// components/live-classes/exportParticipants.ts
// Exportação (CSV/Excel/PDF) dos separadores "Participantes" e "Presenças":
// vai buscar TODAS as páginas com os filtros em vigor (não só a página
// visível) e passa-as ao exportador de tabelas.

import { apiClient } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/format';
import { exportTable, type ExportFormat } from '@/lib/tableExport';
import { LIVE_ATTENDANCE_STATUS_CFG } from './constants';
import type { LiveParticipant, PaginatedMeta } from './types';

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

type Params = Record<string, string | number | undefined>;

async function fetchAll(params: Params): Promise<LiveParticipant[]> {
  const all: LiveParticipant[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await apiClient.get<PaginatedMeta<LiveParticipant>>(
      '/live-classes/participants',
      { params: { ...params, page, limit: PAGE_SIZE } },
    );
    all.push(...res.data);
    if (page >= res.meta.totalPages) break;
  }
  return all;
}

const statusLabel = (p: LiveParticipant) =>
  LIVE_ATTENDANCE_STATUS_CFG[p.status ?? p.computedStatus]?.label ??
  p.status ??
  p.computedStatus;

const dt = (iso: string | null | undefined) => (iso ? formatDateTime(iso) : '');

export async function exportLiveParticipants(
  format: ExportFormat,
  kind: 'participants' | 'attendance',
  filters: Params,
): Promise<number> {
  const { page: _page, limit: _limit, ...rest } = filters;
  const rows = await fetchAll(rest);

  if (kind === 'participants') {
    await exportTable(format, {
      title: 'Participantes das aulas ao vivo',
      filename: 'participantes-aulas-ao-vivo',
      headers: [
        'Participante',
        'Nº colaborador',
        'Email',
        'Departamento',
        'Unidade',
        'Aula',
        'Curso',
        'Data da aula',
        'Estado',
      ],
      rows: rows.map((p) => [
        p.user.fullName,
        p.user.employeeNumber,
        p.user.email,
        p.user.department?.name,
        p.user.unit?.name,
        p.liveClass.topic,
        p.liveClass.course?.title,
        dt(p.liveClass.scheduledAt),
        statusLabel(p),
      ]),
    });
  } else {
    await exportTable(format, {
      title: 'Presenças nas aulas ao vivo',
      filename: 'presencas-aulas-ao-vivo',
      headers: [
        'Participante',
        'Departamento',
        'Aula',
        'Sessão',
        'Data da aula',
        'Entrada',
        'Saída',
        'Duração (min)',
        'Presença (%)',
        'Estado',
        'Justificação',
      ],
      rows: rows.map((p) => [
        p.user.fullName,
        p.user.department?.name,
        p.liveClass.topic,
        p.session ? `Sessão ${p.session.seq}` : '',
        dt(p.liveClass.scheduledAt),
        dt(p.joinedAt),
        dt(p.leftAt),
        p.durationMinutes,
        p.attendancePercent,
        statusLabel(p),
        p.justification,
      ]),
    });
  }
  return rows.length;
}
