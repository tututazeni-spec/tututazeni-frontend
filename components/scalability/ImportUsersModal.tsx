// components/scalability/ImportUsersModal.tsx
// Modal "Importar CSV" — separador Utilizadores do módulo de Escalabilidade.
// A página só monta o componente quando aberto, por isso o Modal fica sempre
// `open` e delega o fecho em `onClose` (X, Escape, clique fora).
//
// O ficheiro é lido e validado no browser primeiro (ver importUsersCsv.ts)
// para dar feedback imediato — contagem de linhas, emails válidos/ignorados —
// e só depois enviado tal-e-qual (base64) para POST /scalability/users/bulk-import
// (@Roles ADMIN), que faz a validação/criação reais. `tenantId` vem do
// `dashboard.tenantInfo.id` já carregado pelo container (plataforma
// single-tenant na prática).

'use client';

import { useState } from 'react';
import { AlertCircle, FileCheck2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { parseUsersCsv, type ParsedUsersCsv } from './importUsersCsv';
import type { BulkImportResultDto } from './types';

export interface ImportUsersModalProps {
  tenantId: string;
  onClose: () => void;
}

export function ImportUsersModal({ tenantId, onClose }: ImportUsersModalProps) {
  const notify = useToast();
  const [fileName, setFileName] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedUsersCsv | null>(null);
  const [readError, setReadError] = useState('');

  const importMutation = useApiMutation<BulkImportResultDto, string>(
    (base64Payload) =>
      apiClient.post('/scalability/users/bulk-import', {
        tenantId,
        format: 'CSV',
        payload: base64Payload,
        upsert: false,
        sendWelcomeEmail: true,
      }),
    {
      invalidateKeys: [
        queryKeys.scalability.dashboard(),
        queryKeys.scalability.automations(),
      ],
    },
  );

  const handleFile = (file: File | undefined) => {
    setParsed(null);
    setRawText('');
    setReadError('');
    if (!file) {
      setFileName('');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setRawText(text);
      setParsed(parseUsersCsv(text));
    };
    reader.onerror = () =>
      setReadError('Não foi possível ler o ficheiro. Tenta outra vez.');
    reader.readAsText(file);
  };

  const canImport =
    !!parsed && !parsed.error && !readError && parsed.validRows > 0 && !importMutation.isPending;

  const handleImport = () => {
    if (!canImport) return;
    const base64Payload =
      typeof window === 'undefined'
        ? Buffer.from(rawText, 'utf-8').toString('base64')
        : window.btoa(unescape(encodeURIComponent(rawText)));

    importMutation.mutate(base64Payload, {
      onSuccess: (result) => {
        notify({
          title:
            result.failed > 0
              ? `${result.created} importados, ${result.failed} falharam (ver consola para detalhes)`
              : `${result.created} utilizador${result.created === 1 ? '' : 'es'} importado${result.created === 1 ? '' : 's'} com sucesso`,
          intent: result.failed > 0 ? 'info' : 'success',
        });
        onClose();
      },
      onError: (err) => {
        reportError(err, { source: 'ImportUsersModal.handleImport' });
        notify({ title: 'Não foi possível importar os utilizadores', intent: 'danger' });
      },
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Importar utilizadores por CSV"
        description="O ficheiro precisa de um cabeçalho com uma coluna 'email'. As linhas são validadas no browser antes de importar."
        className="max-w-lg"
      >
        <div className="mt-5 space-y-4">
          <FormField
            label="Ficheiro CSV"
            htmlFor="iu-file"
            hint="Formato: cabeçalho + uma linha por utilizador (ex.: email,fullname,departmentid)."
          >
            <Input
              id="iu-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="file:mr-3 file:rounded-control file:border-0 file:bg-surface-sunken file:px-3 file:py-1 file:font-body file:text-xs file:text-ink"
            />
          </FormField>

          {readError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {readError}
            </div>
          )}

          {parsed?.error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {parsed.error}
            </div>
          )}

          {parsed && !parsed.error && (
            <div className="rounded-card border border-border bg-surface-sunken p-4">
              <div className="mb-2 flex items-center gap-2 font-body text-sm font-semibold text-ink">
                <FileCheck2 size={16} strokeWidth={1.75} />
                {fileName}
              </div>
              <p className="font-body text-sm text-ink-muted">
                {parsed.totalRows} linha{parsed.totalRows === 1 ? '' : 's'} ·{' '}
                <span className="font-semibold text-ink">
                  {parsed.validRows} válidas
                </span>
                {parsed.invalidRows > 0 && (
                  <> · {parsed.invalidRows} ignoradas (sem email)</>
                )}
              </p>
              <p className="mt-1 font-body text-xs text-ink-faint">
                Colunas: {parsed.headers.join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!canImport}>
            {importMutation.isPending ? 'A importar…' : 'Importar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
