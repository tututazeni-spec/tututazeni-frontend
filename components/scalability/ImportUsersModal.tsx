// components/scalability/ImportUsersModal.tsx
// Modal "Importar CSV" — separador Utilizadores do módulo de Escalabilidade.
// A página só monta o componente quando aberto, por isso o Modal fica sempre
// `open` e delega o fecho em `onClose` (X, Escape, clique fora).
//
// NOTA: o módulo corre sobre dados mock (ver
// app/(platform)/scalability/page.tsx). O ficheiro é lido e validado no
// browser (ver importUsersCsv.ts) para dar feedback real — contagem de linhas,
// emails válidos/ignorados — e a "importação" soma as linhas válidas à
// contagem local de utilizadores activos (limitada por maxUsers). O endpoint
// real (POST /scalability/users/bulk-import) exige um tenantId que os dados de
// sessão actuais não fornecem.

'use client';

import { useState } from 'react';
import { AlertCircle, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { parseUsersCsv, type ParsedUsersCsv } from './importUsersCsv';

export interface ImportUsersModalProps {
  activeUsersCount: number;
  maxUsers: number;
  onImported: (newActiveUsersCount: number) => void;
  onClose: () => void;
}

export function ImportUsersModal({
  activeUsersCount,
  maxUsers,
  onImported,
  onClose,
}: ImportUsersModalProps) {
  const notify = useToast();
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedUsersCsv | null>(null);
  const [readError, setReadError] = useState('');

  const handleFile = (file: File | undefined) => {
    setParsed(null);
    setReadError('');
    if (!file) {
      setFileName('');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setParsed(parseUsersCsv(text));
    };
    reader.onerror = () =>
      setReadError('Não foi possível ler o ficheiro. Tenta outra vez.');
    reader.readAsText(file);
  };

  const licencesLeft = Math.max(0, maxUsers - activeUsersCount);
  const willAdd = parsed ? Math.min(parsed.validRows, licencesLeft) : 0;
  const newCount = activeUsersCount + willAdd;

  const canImport =
    !!parsed && !parsed.error && !readError && parsed.validRows > 0;

  const handleImport = () => {
    if (!canImport || !parsed) return;
    onImported(newCount);
    const capped = willAdd < parsed.validRows;
    notify({
      title: capped
        ? `Importados ${willAdd} de ${parsed.validRows} — limite de ${maxUsers.toLocaleString('pt-PT')} licenças atingido`
        : `${willAdd} utilizador${willAdd === 1 ? '' : 'es'} importado${willAdd === 1 ? '' : 's'} — ${newCount.toLocaleString('pt-PT')} activos`,
      intent: 'success',
    });
    onClose();
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
            hint="Formato: cabeçalho + uma linha por utilizador (ex.: name,email,department)."
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
              {parsed.validRows > 0 && (
                <p className="mt-2 font-body text-xs text-ink-muted">
                  Serão adicionados {willAdd} utilizadores · contagem passa a{' '}
                  {newCount.toLocaleString('pt-PT')} de{' '}
                  {maxUsers.toLocaleString('pt-PT')}.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!canImport}>
            Importar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
