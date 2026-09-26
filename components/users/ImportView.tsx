// components/users/ImportView.tsx
// Separador "Importação" do módulo (docs/modulo_users.md Ponto 5) — fluxo
// completo: ficheiro → mapeamento de colunas → pré-visualização (dryRun,
// deteção de duplicados/erros) → confirmação → relatório, mais o histórico
// de importações anteriores (mesma UserAuditLog do separador "Histórico &
// Auditoria", filtrada por action=BULK_IMPORT).
//
// Só CSV real é suportado — não .xlsx binário. O parsing/mapeamento fica
// todo no browser (importUsersCsv.ts); o backend (POST /users/import) só
// recebe as linhas já mapeadas e faz o que precisa de bater na BD:
// resolver departamento/cargo por nome, detectar duplicados contra
// utilizadores existentes e criar/actualizar.

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, FileCheck2, Upload } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
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
  guessMapping,
  mapRows,
  parseCsv,
  IMPORT_FIELDS,
  IMPORT_FIELD_LABELS,
  type ImportField,
  type ParsedCsv,
} from './importUsersCsv';
import { auditActionLabel, describeAuditMeta } from './auditLogLabels';
import type { ImportReport, ImportUserRow, ModuleAuditLogsResponse } from './types';

const FIELD_ITEMS = IMPORT_FIELDS.map((f) => ({ value: f, label: IMPORT_FIELD_LABELS[f] }));

const OUTCOME_BADGE: Record<string, { label: string; intent: 'success' | 'info' | 'warning' | 'danger' }> = {
  create: { label: 'Criar', intent: 'success' },
  update: { label: 'Atualizar', intent: 'info' },
  'skip-duplicate': { label: 'Duplicado no ficheiro', intent: 'warning' },
  'skip-existing': { label: 'Já existe', intent: 'warning' },
  error: { label: 'Erro', intent: 'danger' },
};

type Step = 'upload' | 'map' | 'result';

export function ImportView() {
  const notify = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [readError, setReadError] = useState('');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ImportField[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [payloadRows, setPayloadRows] = useState<ImportUserRow[]>([]);

  const importMutation = useApiMutation<
    ImportReport,
    { rows: ImportUserRow[]; dryRun: boolean; updateExisting: boolean }
  >((vars) => apiClient.post('/users/import', vars), {
    invalidateKeys: [queryKeys.users.all],
  });

  const { data: history } = useApiQuery<ModuleAuditLogsResponse>(
    queryKeys.users.moduleAuditLogs({ action: 'BULK_IMPORT', limit: 5 }),
    '/users/audit-logs',
    { params: { action: 'BULK_IMPORT', limit: 5 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const handleFile = (file: File | undefined) => {
    setReadError('');
    setParsed(null);
    setReport(null);
    if (!file) {
      setFileName('');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = parseCsv(text);
      setParsed(result);
      if (!result.error) {
        setMapping(guessMapping(result.headers));
        setStep('map');
      }
    };
    reader.onerror = () => setReadError('Não foi possível ler o ficheiro. Tenta outra vez.');
    reader.readAsText(file);
  };

  const mappedHasRequiredFields = mapping.includes('email') && mapping.includes('fullName');

  const draftRows = useMemo(
    () => (parsed ? mapRows(parsed.rows, mapping) : []),
    [parsed, mapping],
  );

  const handlePreview = () => {
    if (!parsed || !mappedHasRequiredFields) return;
    const rows: ImportUserRow[] = draftRows.map(({ line: _line, missingRequired: _mr, ...row }) => row);
    setPayloadRows(rows);
    importMutation.mutate(
      { rows, dryRun: true, updateExisting },
      {
        onSuccess: (result) => {
          setReport(result);
          setStep('result');
        },
        onError: (err) => {
          reportError(err, { source: 'ImportView.handlePreview' });
          notify({ title: 'Não foi possível pré-visualizar a importação', intent: 'danger' });
        },
      },
    );
  };

  const handleConfirm = () => {
    importMutation.mutate(
      { rows: payloadRows, dryRun: false, updateExisting },
      {
        onSuccess: (result) => {
          setReport(result);
          notify({
            title: `Importação concluída: ${result.created} criados, ${result.updated} atualizados, ${result.errors.length} erros`,
            intent: result.errors.length > 0 ? 'info' : 'success',
          });
        },
        onError: (err) => {
          reportError(err, { source: 'ImportView.handleConfirm' });
          notify({ title: 'Não foi possível concluir a importação', intent: 'danger' });
        },
      },
    );
  };

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setReadError('');
    setParsed(null);
    setMapping([]);
    setReport(null);
    setPayloadRows([]);
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="mb-4 text-sm font-semibold text-ink">1. Carregar ficheiro</div>
        <FormField
          label="Ficheiro CSV"
          htmlFor="import-file"
          hint="Cabeçalho + uma linha por utilizador. Excel: exportar como CSV primeiro (Ficheiro → Exportar → CSV)."
        >
          <Input
            id="import-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="file:mr-3 file:rounded-control file:border-0 file:bg-surface-sunken file:px-3 file:py-1 file:font-body file:text-xs file:text-ink"
          />
        </FormField>

        {readError && (
          <div className="mt-3 flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {readError}
          </div>
        )}
        {parsed?.error && (
          <div className="mt-3 flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {parsed.error}
          </div>
        )}
        {parsed && !parsed.error && (
          <div className="mt-3 flex items-center gap-2 font-body text-sm text-ink-muted">
            <FileCheck2 size={16} strokeWidth={1.75} className="text-success" />
            {fileName} — {parsed.rows.length} linha{parsed.rows.length === 1 ? '' : 's'} de dados,{' '}
            {parsed.headers.length} coluna{parsed.headers.length === 1 ? '' : 's'}
          </div>
        )}
      </Card>

      {(step === 'map' || step === 'result') && parsed && !parsed.error && (
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold text-ink">2. Mapear colunas</div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Coluna no ficheiro</TableHeaderCell>
                <TableHeaderCell>Exemplo</TableHeaderCell>
                <TableHeaderCell>Campo</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parsed.headers.map((header, i) => (
                <TableRow key={header + i}>
                  <TableCell className="text-sm font-medium text-ink">{header}</TableCell>
                  <TableCell className="text-xs text-ink-faint">{parsed.rows[0]?.[i] ?? '—'}</TableCell>
                  <TableCell>
                    <Select
                      items={FIELD_ITEMS}
                      value={mapping[i] ?? 'ignore'}
                      onValueChange={(v) =>
                        setMapping((m) => m.map((x, idx) => (idx === i ? (v as ImportField) : x)))
                      }
                      className="w-52"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!mappedHasRequiredFields && (
            <p className="mt-3 font-body text-xs text-danger">
              Mapeia pelo menos as colunas &ldquo;Email&rdquo; e &ldquo;Nome completo&rdquo; para continuar.
            </p>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded accent-primary"
            />
            Atualizar utilizadores já existentes (por email) em vez de saltar
          </label>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handlePreview}
              disabled={!mappedHasRequiredFields || importMutation.isPending}
            >
              {importMutation.isPending && step !== 'result' ? 'A pré-visualizar…' : 'Pré-visualizar'}
            </Button>
          </div>
        </Card>
      )}

      {step === 'result' && report && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-ink">
              3. {report.dryRun ? 'Pré-visualização' : 'Relatório de importação'}
            </div>
            <div className="flex gap-2">
              <Badge intent="success">{report.created} a criar</Badge>
              <Badge intent="info">{report.updated} a atualizar</Badge>
              <Badge intent="warning">{report.skipped} ignorados</Badge>
              <Badge intent="danger">{report.errors.length} erros</Badge>
            </div>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Linha</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Resultado</TableHeaderCell>
                <TableHeaderCell>Detalhe</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.rows.map((row) => {
                const cfg = OUTCOME_BADGE[row.outcome];
                return (
                  <TableRow key={row.line}>
                    <TableCell className="text-xs text-ink-faint">{row.line}</TableCell>
                    <TableCell className="text-sm text-ink">{row.email}</TableCell>
                    <TableCell>
                      <Badge intent={cfg.intent}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-ink-faint">{row.detail ?? '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end gap-3">
            <Button intent="ghost" onClick={handleReset}>
              Nova importação
            </Button>
            {report.dryRun && (
              <Button onClick={handleConfirm} disabled={importMutation.isPending}>
                {importMutation.isPending ? 'A importar…' : 'Confirmar importação'}
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Upload size={16} strokeWidth={1.75} />
          Histórico de importações
        </div>
        {!history || history.data.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">Sem importações registadas.</p>
        ) : (
          <ul className="space-y-2">
            {history.data.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0 font-body text-sm"
              >
                <span className="text-ink-muted">{fmtDateTime(log.createdAt)}</span>
                <span className="text-ink-faint">
                  {log.performedBy?.fullName ?? auditActionLabel(log.action)}
                </span>
                <span className="text-ink">{describeAuditMeta(log.action, log.meta) ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
