// components/audit/ReportsView.tsx
// Aba 07 «Relatórios» (docs/modulo_audit.md §10): 14 relatórios por período,
// módulo, perfil, utilizador, departamento, tipo de evento, gravidade e
// resultado, com pré-visualização no ecrã antes da exportação PDF/XLSX/CSV.
// Cada exportação fica guardada em «Exportações e Evidências».

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText, Play } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { downloadAuditFile } from './downloadAuditFile';
import type { AuditReportCatalogItem, AuditReportResult } from './types';

const MODULES = [
  { value: 'users', label: 'Utilizadores' },
  { value: 'organization', label: 'Organização' },
  { value: 'lms', label: 'Formação' },
  { value: 'performance', label: 'Desempenho' },
  { value: 'talent', label: 'Talento e Carreira' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'attendance-leave', label: 'Assiduidade e Licenças' },
  { value: 'documents', label: 'Documentos' },
  { value: 'integrations', label: 'Integrações' },
  { value: 'security', label: 'Segurança' },
];
const ROLES = ['ADMIN', 'RH', 'GESTOR', 'DIRECTOR', 'LIDER', 'COLABORADOR'];
const SEVERITY_ITEMS = [
  { value: 'ALL', label: 'Todas as gravidades' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];
const RESULT_ITEMS = [
  { value: 'ALL', label: 'Todos os resultados' },
  { value: 'SUCCESS', label: 'Sucesso' },
  { value: 'FAILED', label: 'Falhou' },
  { value: 'DENIED', label: 'Negado' },
];
export const CONFIDENTIALITY_ITEMS = [
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
  { value: 'RESTRICTED', label: 'Restrito' },
];
// Tipos cujo filtro «estado» tem significado (incidentes/auditorias).
const STATE_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  incidents: [
    { value: 'ALL', label: 'Todos os estados' },
    { value: 'OPEN', label: 'Aberto' },
    { value: 'IN_ANALYSIS', label: 'Em análise' },
    { value: 'MITIGATED', label: 'Mitigado' },
    { value: 'CLOSED', label: 'Encerrado' },
  ],
  audits: [
    { value: 'ALL', label: 'Todos os estados' },
    { value: 'COMPLETED', label: 'Concluída' },
    { value: 'IN_PROGRESS', label: 'Em execução' },
    { value: 'IN_REVIEW', label: 'Em revisão' },
    { value: 'AWAITING_CORRECTIVE_ACTIONS', label: 'A aguardar ações' },
    { value: 'CANCELLED', label: 'Cancelada' },
  ],
};

interface Form {
  type: string;
  from: string;
  to: string;
  modules: string[];
  roles: string[];
  userId: string;
  departmentId: string;
  eventType: string;
  severity: string;
  result: string;
  state: string;
  confidentiality: string;
}

const EMPTY: Form = {
  type: 'executive-summary',
  from: '',
  to: '',
  modules: [],
  roles: [],
  userId: '',
  departmentId: '',
  eventType: '',
  severity: 'ALL',
  result: 'ALL',
  state: 'ALL',
  confidentiality: 'CONFIDENTIAL',
};

function toParams(f: Form): Record<string, string> {
  const p: Record<string, string> = { type: f.type };
  if (f.from) p.from = new Date(`${f.from}T00:00:00`).toISOString();
  if (f.to) p.to = new Date(`${f.to}T23:59:59.999`).toISOString();
  if (f.modules.length) p.modules = f.modules.join(',');
  if (f.roles.length) p.roles = f.roles.join(',');
  if (f.userId) p.userId = f.userId;
  if (f.departmentId) p.departmentId = f.departmentId;
  if (f.eventType.trim()) p.eventType = f.eventType.trim();
  if (f.severity !== 'ALL') p.severity = f.severity;
  if (f.result !== 'ALL') p.result = f.result;
  if (f.state !== 'ALL') p.state = f.state;
  return p;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-white text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

export function ReportsView() {
  const notify = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [applied, setApplied] = useState<Record<string, string> | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const { data: catalog } = useApiQuery<AuditReportCatalogItem[]>(
    queryKeys.audit.reportCatalog(),
    '/audit/reports/catalog',
    { staleTime: STALE_TIME.STATIC },
  );
  const {
    data: report,
    isFetching,
    error,
  } = useApiQuery<AuditReportResult>(
    queryKeys.audit.reportPreview(applied ?? {}),
    '/audit/reports/preview',
    {
      params: applied ?? undefined,
      enabled: !!applied,
      staleTime: STALE_TIME.REALTIME,
      retry: false,
    },
  );

  const stateItems = STATE_TYPES[form.type];

  const exportAs = async (format: 'pdf' | 'xlsx' | 'csv') => {
    setExporting(format);
    try {
      await downloadAuditFile(
        '/audit/reports/export',
        {
          ...toParams(form),
          format,
          confidentiality: form.confidentiality,
        },
        `auditoria.${format}`,
      );
      notify({
        title: 'Exportação concluída',
        description: 'O ficheiro ficou registado em Exportações e Evidências.',
        intent: 'success',
      });
      qc.invalidateQueries({ queryKey: queryKeys.audit.all });
    } catch (e) {
      notify({
        title: 'Não foi possível exportar',
        description: e instanceof Error ? e.message : undefined,
        intent: 'danger',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField label="Relatório" htmlFor="rep-type">
              <Select
                items={(catalog ?? []).map((c) => ({
                  value: c.type,
                  label: c.title,
                }))}
                value={form.type}
                onValueChange={(v) => set({ type: v, state: 'ALL' })}
              />
            </FormField>
            <FormField label="Data inicial" htmlFor="rep-from">
              <Input
                id="rep-from"
                type="date"
                value={form.from}
                onChange={(e) => set({ from: e.target.value })}
              />
            </FormField>
            <FormField label="Data final" htmlFor="rep-to">
              <Input
                id="rep-to"
                type="date"
                value={form.to}
                onChange={(e) => set({ to: e.target.value })}
              />
            </FormField>
            <FormField label="Gravidade" htmlFor="rep-sev">
              <Select
                items={SEVERITY_ITEMS}
                value={form.severity}
                onValueChange={(v) => set({ severity: v })}
              />
            </FormField>
            <FormField label="Resultado" htmlFor="rep-res">
              <Select
                items={RESULT_ITEMS}
                value={form.result}
                onValueChange={(v) => set({ result: v })}
              />
            </FormField>
            {stateItems ? (
              <FormField label="Estado" htmlFor="rep-state">
                <Select
                  items={stateItems}
                  value={form.state}
                  onValueChange={(v) => set({ state: v })}
                />
              </FormField>
            ) : (
              <FormField label="Tipo de evento (ação)" htmlFor="rep-evt">
                <Input
                  id="rep-evt"
                  placeholder="Ex.: UPDATE, EXPORT"
                  value={form.eventType}
                  onChange={(e) => set({ eventType: e.target.value })}
                />
              </FormField>
            )}
            <FormField label="Utilizador (ID)" htmlFor="rep-user">
              <Input
                id="rep-user"
                type="number"
                min={1}
                value={form.userId}
                onChange={(e) => set({ userId: e.target.value })}
              />
            </FormField>
            <FormField label="Unidade / departamento (ID)" htmlFor="rep-dep">
              <Input
                id="rep-dep"
                type="number"
                min={1}
                value={form.departmentId}
                onChange={(e) => set({ departmentId: e.target.value })}
              />
            </FormField>
            <FormField
              label="Confidencialidade da exportação"
              htmlFor="rep-conf"
            >
              <Select
                items={CONFIDENTIALITY_ITEMS}
                value={form.confidentiality}
                onValueChange={(v) => set({ confidentiality: v })}
              />
            </FormField>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1.5 font-body text-xs text-ink-faint">
                Módulos (vazio = todos)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODULES.map((m) => (
                  <Chip
                    key={m.value}
                    active={form.modules.includes(m.value)}
                    onClick={() =>
                      set({ modules: toggle(form.modules, m.value) })
                    }
                  >
                    {m.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-body text-xs text-ink-faint">
                Perfis (vazio = todos)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => (
                  <Chip
                    key={r}
                    active={form.roles.includes(r)}
                    onClick={() => set({ roles: toggle(form.roles, r) })}
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setApplied(toParams(form))}
              loading={isFetching}
            >
              <Play size={14} strokeWidth={1.75} className="mr-1.5" />
              Pré-visualizar
            </Button>
            <Button intent="ghost" onClick={() => setForm(EMPTY)}>
              Limpar filtros
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                intent="secondary"
                loading={exporting === 'pdf'}
                onClick={() => exportAs('pdf')}
              >
                <FileText size={14} strokeWidth={1.75} className="mr-1.5" />
                PDF
              </Button>
              <Button
                intent="secondary"
                loading={exporting === 'xlsx'}
                onClick={() => exportAs('xlsx')}
              >
                <FileSpreadsheet
                  size={14}
                  strokeWidth={1.75}
                  className="mr-1.5"
                />
                XLSX
              </Button>
              <Button
                intent="secondary"
                loading={exporting === 'csv'}
                onClick={() => exportAs('csv')}
              >
                <Download size={14} strokeWidth={1.75} className="mr-1.5" />
                CSV
              </Button>
            </div>
          </div>
          <p className="mt-2 font-body text-xs text-ink-faint">
            Cada exportação regista quem exportou, quando, os filtros usados e o
            resultado. Os ficheiros podem conter dados pessoais ou salariais.
          </p>
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
          {error.message}
        </div>
      )}

      {!applied ? (
        <EmptyState
          icon={FileText}
          title="Escolha um relatório"
          description="Defina os filtros e use «Pré-visualizar» para ver o resultado antes de exportar."
        />
      ) : isFetching && !report ? (
        <Skeleton rows={8} />
      ) : report ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-body text-xs text-ink-faint">
            <span className="font-medium text-ink">{report.title}</span>
            <span>
              {report.rows.length} de {report.total} registos
              {report.truncated && ' — limite de 5000 linhas por relatório'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  {report.columns.map((c) => (
                    <TableHeaderCell key={c}>{c}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {report.rows.slice(0, 200).map((r, i) => (
                  <TableRow key={i}>
                    {report.columns.map((c) => (
                      <td
                        key={c}
                        className="max-w-[260px] truncate px-3 py-2 font-body text-xs text-ink"
                        title={String(r[c] ?? '')}
                      >
                        {String(r[c] ?? '—')}
                      </td>
                    ))}
                  </TableRow>
                ))}
                {report.rows.length === 0 && (
                  <TableRow>
                    <td
                      colSpan={report.columns.length || 1}
                      className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                    >
                      Sem registos para os filtros seleccionados
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {report.rows.length > 200 && (
            <p className="mt-2 font-body text-xs text-ink-faint">
              O ecrã mostra os primeiros 200 registos; exporte para ver todos.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
