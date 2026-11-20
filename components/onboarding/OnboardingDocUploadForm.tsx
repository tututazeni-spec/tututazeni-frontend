// components/onboarding/OnboardingDocUploadForm.tsx
// Formulário de submissão de documento do plano de onboarding, usado no
// separador "Documentos" do MyPlanView. Qualquer utilizador autenticado
// pode submeter para o seu próprio plano — POST /onboarding/documents
// (UploadDocumentDto: planId, documentType, fileUrl, notes?).
//
// O documento é um **PDF de até 3 MB** carregado aqui e enviado em `fileUrl`
// como data URL base64 (mesmo padrão das lições PDF; validado no backend por
// @IsAllowedFileUrl). O formulário já não aceita links externos. O documento
// nasce em PENDING e o RH valida-o no detalhe do plano.

'use client';

import { useState } from 'react';
import { useRef } from 'react';
import {
  AlertCircle,
  CloudUpload,
  FileText,
  FileUp,
  MessageSquareText,
  X,
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { fileToPdfDataUrl, pdfErrorMessage } from '@/lib/lessonPdf';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const OTHER = '__other__';
const DOCUMENT_TYPES = [
  'Cópia do BI',
  'NIF',
  'NIB / IBAN',
  'Contrato assinado',
  'Certificado de habilitações',
  'Registo criminal',
  'Atestado médico',
  'Fotografia',
  'Comprovativo de morada',
].map((t) => ({ value: t, label: t }));
const DOCUMENT_TYPE_ITEMS = [
  ...DOCUMENT_TYPES,
  { value: OTHER, label: 'Outro…' },
];

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
  const [typeChoice, setTypeChoice] = useState('');
  const [customType, setCustomType] = useState('');
  const documentType = typeChoice === OTHER ? customType : typeChoice;
  // PDF carregado (data URL).
  const [pdf, setPdf] = useState<{ name: string; dataUrl: string } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit = documentType.trim().length > 0 && !!pdf;

  const upload = useApiMutation(
    () =>
      apiClient.post('/onboarding/documents', {
        planId,
        documentType: documentType.trim(),
        fileUrl: pdf?.dataUrl ?? '',
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({ title: 'Documento submetido', intent: 'success' });
        setTypeChoice('');
        setCustomType('');
        setPdf(null);
        setNotes('');
        onUploaded();
      },
      onError: (e) =>
        setError(e.message || 'Erro ao submeter o documento. Tente novamente.'),
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
    <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
      {/* Cabeçalho — mesma altura e tipo de letra do cabeçalho da lista */}
      <div className="flex items-center gap-3 bg-brand-dark px-4 py-3 text-white">
        <FileUp size={16} strokeWidth={2} className="shrink-0" />
        <span className="h-4 w-px bg-white/40" aria-hidden="true" />
        <h3 className="m-0 font-body text-xs font-semibold uppercase tracking-wider text-white">
          Submeter documento
        </h3>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="od-type"
              className="font-body text-sm font-bold text-brand-dark"
            >
              Tipo de documento *
            </label>
            <Select
              items={DOCUMENT_TYPE_ITEMS}
              value={typeChoice || undefined}
              onValueChange={setTypeChoice}
              placeholder="Selecione o tipo de documento"
              className="w-full"
            />
            {typeChoice === OTHER && (
              <Input
                id="od-type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Indique o tipo de documento"
                maxLength={120}
                className="w-full"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="od-pdf"
              className="font-body text-sm font-bold text-brand-dark"
            >
              Documento (PDF) *
            </label>
            <input
              ref={fileInput}
              id="od-pdf"
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handlePickPdf(e.target.files?.[0])}
            />
            {pdf ? (
              <div className="flex items-center gap-3 rounded-[16px] border border-brand-line bg-surface-sunken px-4 py-4 text-sm text-ink">
                <FileText
                  size={18}
                  strokeWidth={1.75}
                  className="shrink-0 text-brand-dark"
                />
                <span className="min-w-0 flex-1 truncate">{pdf.name}</span>
                <IconButton
                  icon={X}
                  label="Remover PDF"
                  intent="ghost"
                  size="xs"
                  type="button"
                  onClick={() => setPdf(null)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex w-full items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-brand-line bg-surface px-4 py-5 font-body text-base font-bold text-brand-dark transition-colors hover:bg-surface-sunken"
              >
                <CloudUpload size={26} strokeWidth={1.75} />
                Carregar PDF
              </button>
            )}
            <p className="m-0 font-body text-sm text-ink-muted">
              Apenas PDF, máx. 3 MB.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="od-notes"
              className="font-body text-sm font-bold text-brand-dark"
            >
              Notas
            </label>
            <div className="flex items-start gap-3 px-1 py-1">
              <MessageSquareText
                size={18}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0 text-ink-muted"
              />
              <Textarea
                id="od-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Opcional — contexto para quem valida."
                className="min-w-0 flex-1 resize-none !border-0 !bg-transparent !p-0 focus:!ring-0"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            {loading ? 'A submeter…' : 'Submeter documento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
