// components/onboarding/OnboardingDocUploadForm.tsx
// Formulário de submissão de documento do plano de onboarding, usado no
// separador "Documentos" do MyPlanView. Qualquer utilizador autenticado
// pode submeter para o seu próprio plano — POST /onboarding/documents
// (UploadDocumentDto: planId, documentType, fileUrl, notes?).
//
// `fileUrl` é validado no backend por @IsAllowedFileUrl: tem de ser uma
// URL **HTTPS** (e, se ALLOWED_FILE_HOST estiver definido, de um domínio
// autorizado). Não aceita ficheiros/base64 — é um link para o documento
// (OneDrive, Google Drive, etc.). O documento nasce em PENDING e o RH
// valida-o no detalhe do plano.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

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
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const canSubmit = documentType.trim().length > 0 && fileUrl.trim().length > 0;

  const upload = useApiMutation(
    () =>
      apiClient.post('/onboarding/documents', {
        planId,
        documentType: documentType.trim(),
        fileUrl: fileUrl.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({ title: 'Documento submetido', intent: 'success' });
        setDocumentType('');
        setFileUrl('');
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
            hint="URL HTTPS para o ficheiro (OneDrive, Google Drive, …)."
          >
            <Input
              id="od-url"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…"
              className="w-full"
            />
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
