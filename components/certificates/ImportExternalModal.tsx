// components/certificates/ImportExternalModal.tsx
// Importa um certificado obtido fora da plataforma (PDF até 5 MB). Fica sempre
// identificado como externo; sem "já validado" aguarda a aprovação de RH/ADMIN.

'use client';

import { useFormState } from '@/hooks/useFormState';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { UserPicker } from '@/components/processes/UserPicker';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Checkbox } from '@/components/ui/Checkbox';

const MAX_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error('Não foi possível ler o ficheiro.'));
    reader.readAsDataURL(file);
  });
}

interface ImportExternalModalFormValues {
  userId: string;
  title: string;
  issuerName: string;
  completedAt: string;
  expiresAt: string;
  hours: string;
  observations: string;
  validated: boolean;
  document: string | null;
  fileName: string;
  error: string | null;
}

export function ImportExternalModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { values: formValues, set: setField } =
    useFormState<ImportExternalModalFormValues>({
      userId: '',
      title: '',
      issuerName: '',
      completedAt: '',
      expiresAt: '',
      hours: '',
      observations: '',
      validated: false,
      document: null,
      fileName: '',
      error: null,
    });
  const {
    userId,
    title,
    issuerName,
    completedAt,
    expiresAt,
    hours,
    observations,
    validated,
    document,
    fileName,
    error,
  } = formValues;

  const save = useApiMutation(
    () =>
      apiClient.post<{ outcome: 'IMPORTED' | 'EXISTS' }>(
        '/certificates/external',
        {
          userId: Number(userId),
          title: title.trim(),
          issuerName: issuerName.trim(),
          completedAt,
          expiresAt: expiresAt || undefined,
          hours: hours === '' ? undefined : Number(hours),
          observations: observations.trim() || undefined,
          validated,
          document,
        },
      ),
    {
      invalidateKeys: [
        queryKeys.certificates.all,
        queryKeys.courses.myCertificates(),
      ],
      onSuccess: (r) => {
        toast({
          title:
            r.outcome === 'EXISTS'
              ? 'Este certificado já tinha sido importado.'
              : 'Certificado externo importado.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) => setField('error', e.message),
    },
  );

  async function onFile(file: File | undefined) {
    setField('error', null);
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setField('document', null);
      setField('fileName', '');
      setField('error', 'O documento tem de ser um PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setField('document', null);
      setField('fileName', '');
      setField('error', 'O PDF excede 5 MB.');
      return;
    }
    try {
      setField('document', await readAsDataUrl(file));
      setField('fileName', file.name);
    } catch (e) {
      setField(
        'error',
        e instanceof Error ? e.message : 'Não foi possível ler o ficheiro.',
      );
    }
  }

  function submit() {
    if (!userId) return setField('error', 'Escolha o titular do certificado.');
    if (!title.trim() || !issuerName.trim())
      return setField('error', 'Indique a formação e a entidade emissora.');
    if (!completedAt) return setField('error', 'Indique a data de conclusão.');
    if (expiresAt && expiresAt < completedAt)
      return setField(
        'error',
        'A validade não pode ser anterior à data de conclusão.',
      );
    if (!document) return setField('error', 'Carregue o documento em PDF.');
    setField('error', null);
    save.mutate(undefined);
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Importar certificado externo"
        description="Certificado obtido fora da plataforma. Fica identificado como externo."
        navyHeader
      >
        <div className="space-y-4">
          {error && (
            <AlertCard
              variant="danger"
              title="Verifique os dados"
              message={error}
              compact
            />
          )}
          <FormField label="Titular" htmlFor="ext-user">
            <UserPicker
              value={userId}
              onChange={(v) => setField('userId', v)}
              placeholder="Escolher colaborador…"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Formação" htmlFor="ext-title">
              <Input
                id="ext-title"
                value={title}
                maxLength={200}
                onChange={(e) => setField('title', e.target.value)}
              />
            </FormField>
            <FormField label="Entidade emissora" htmlFor="ext-issuer">
              <Input
                id="ext-issuer"
                value={issuerName}
                maxLength={200}
                onChange={(e) => setField('issuerName', e.target.value)}
              />
            </FormField>
            <FormField label="Data de conclusão" htmlFor="ext-completed">
              <Input
                id="ext-completed"
                type="date"
                value={completedAt}
                onChange={(e) => setField('completedAt', e.target.value)}
              />
            </FormField>
            <FormField label="Validade (opcional)" htmlFor="ext-expires">
              <Input
                id="ext-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setField('expiresAt', e.target.value)}
              />
            </FormField>
            <FormField label="Carga horária (h)" htmlFor="ext-hours">
              <Input
                id="ext-hours"
                type="number"
                min={0}
                max={10000}
                value={hours}
                onChange={(e) => setField('hours', e.target.value)}
              />
            </FormField>
            <FormField
              label="Documento (PDF, até 5 MB)"
              htmlFor="ext-file"
              hint={fileName || undefined}
            >
              <input
                id="ext-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => void onFile(e.target.files?.[0])}
                className="block w-full text-sm text-ink"
              />
            </FormField>
          </div>
          <FormField label="Observações" htmlFor="ext-notes">
            <textarea
              id="ext-notes"
              rows={3}
              maxLength={2000}
              value={observations}
              onChange={(e) => setField('observations', e.target.value)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-ink">
            <Checkbox
              checked={validated}
              onChange={(e) => setField('validated', e.target.checked)}
            />
            Já verifiquei o documento (fica válido de imediato; senão aguarda
            validação)
          </label>
          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? 'A importar…' : 'Importar'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
