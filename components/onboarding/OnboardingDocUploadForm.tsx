// components/onboarding/OnboardingDocUploadForm.tsx
// Formulário de submissão de documento do plano de onboarding, usado no
// separador "Documentos" do MyPlanView. Qualquer utilizador autenticado
// pode submeter para o seu próprio plano — POST /onboarding/documents
// (UploadDocumentDto: planId, documentType, fileUrl, notes?).
//
// `fileUrl` é validado no backend por @IsAllowedFileUrl: ou uma URL **HTTPS**
// (e, se ALLOWED_FILE_HOST estiver definido, de um domínio autorizado —
// OneDrive, Google Drive, etc.), ou um **PDF de até 3 MB** carregado aqui e
// enviado como data URL base64 (mesmo padrão das lições PDF). O documento
// nasce em PENDING e o RH valida-o no detalhe do plano.

'use client';

import { useState } from 'react';
import { useRef } from 'react';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { fileToPdfDataUrl, pdfErrorMessage } from '@/lib/lessonPdf';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

/** Limite do PDF carregado (alinhado com MAX_DOC_PDF_DATA_URL_LEN no backend). */
const MAX_DOC_PDF_BYTES = 3 * 1024 * 1024;

export interface OnboardingDocUploadFormProps {
  planId: number;
  /** Chamado após uma submissão bem-sucedida (ex.: refetch do plano). */
  onUploaded: () => void;
}

export function OnboardingDocUploadForm({
  planId,
  onUploaded,
}: OnboardingDocUploadFormProps) {
  const notify = useToast();
  const [documentType, setDocumentType] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  // PDF carregado (data URL) — alternativa ao link; tem prioridade.
  const [pdf, setPdf] = useState<{ name: string; dataUrl: string } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit =
    documentType.trim().length > 0 && (!!pdf || fileUrl.trim().length > 0);

  const upload = useApiMutation(
    () =>
      apiClient.post('/onboarding/documents', {
        planId,
        documentType: documentType.trim(),
        fileUrl: pdf ? pdf.dataUrl : fileUrl.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({ title: 'Documento submetido', intent: 'success' });
        setDocumentType('');
        setFileUrl('');
        setPdf(null);
        setNotes('');
        onUploaded();
      },
      onError: (e) =>
        setError(
          e.message || 'Erro ao submeter o documento. Verifique o link.',
        ),
    },
  );
  const loading = upload.isPending;

  const handlePickPdf = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      setPdf({
        name: file.name,
        dataUrl: await fileToPdfDataUrl(file, MAX_DOC_PDF_BYTES),
      });
    } catch (e) {
      setPdf(null);
      setError(pdfErrorMessage(e, MAX_DOC_PDF_BYTES));
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setError('');
    upload.mutate(undefined);
  };

  return (
    <Card>
      <CardBody>
        <div className="mb-4 text-sm font-semibold text-ink">
          Submeter documento
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <FormField label="Tipo de documento *" htmlFor="od-type">
            <Input
              id="od-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="Ex.: Cópia do BI, Contrato assinado, NIB"
              maxLength={120}
              className="w-full"
            />
          </FormField>

          <FormField
            label="Link do documento *"
            htmlFor="od-url"
            hint="URL HTTPS para o ficheiro (OneDrive, Google Drive, …) — ou carregue um PDF abaixo."
          >
            <Input
              id="od-url"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…"
              className="w-full"
              disabled={!!pdf}
            />
          </FormField>

          <FormField
            label="Ou carregar documento (PDF)"
            htmlFor="od-pdf"
            hint="Apenas PDF, máx. 3 MB."
          >
            <input
              ref={fileInput}
              id="od-pdf"
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handlePickPdf(e.target.files?.[0])}
            />
            {pdf ? (
              <div className="flex items-center gap-2 rounded-card border border-border bg-surface-sunken px-3 py-2 text-sm text-ink">
                <FileText
                  size={16}
                  strokeWidth={1.75}
                  className="shrink-0 text-ink-muted"
                />
                <span className="min-w-0 flex-1 truncate">{pdf.name}</span>
                <button
                  type="button"
                  aria-label="Remover PDF"
                  onClick={() => setPdf(null)}
                  className="rounded-control p-1 text-ink-muted hover:bg-surface hover:text-ink"
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                intent="secondary"
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={14} strokeWidth={1.75} />
                Carregar PDF
              </Button>
            )}
          </FormField>

          <FormField label="Notas" htmlFor="od-notes">
            <Textarea
              id="od-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Opcional — contexto para quem valida."
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            {loading ? 'A submeter…' : 'Submeter documento'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
