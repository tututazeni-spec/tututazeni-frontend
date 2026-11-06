// components/trainings/manage/DocumentsTab.tsx
// Separador "Documentos" (docs/trainings-detalhado.md pt.11 — programa,
// materiais, lista de presenças, avaliações, documentos administrativos).
// `fileUrl` é validado no backend por @IsAllowedFileUrl: URL HTTPS para o
// ficheiro (OneDrive, Google Drive, …) OU um ficheiro carregado (PDF/PNG/JPG/
// WebP, máx. 4 MB) enviado inline como data URL — mesmo padrão dos
// comprovativos do módulo Leave (useDocUpload).

'use client';

import { useState } from 'react';
import { Clock, FileText, Filter, Plus, Trash2, User } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatDate } from '@/lib/format';
import { openDataUrl } from '@/lib/openDataUrl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ChoiceOrCustom } from '@/components/avatar-training/ChoiceOrCustom';
import { FileOrLinkField } from '../FileOrLinkField';
import type { Training } from '../types';
import { RowCard, RowCardIconButton } from './RowCard';

const BASE_CATEGORIES = [
  'Programa',
  'Materiais',
  'Presenças',
  'Avaliações',
  'Administrativo',
];

interface DocumentsTabProps {
  training: Training;
}

export function DocumentsTab({ training }: DocumentsTabProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [category, setCategory] = useState('');

  const invalidateKeys = [queryKeys.trainings.detail(training.id)];
  const onErr = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const add = useApiMutation(
    () =>
      apiClient.post(`/trainings/${training.id}/documents`, {
        name: name.trim(),
        fileUrl: fileUrl.trim(),
        ...(category.trim() ? { category: category.trim() } : {}),
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Documento adicionado.', intent: 'success' });
        setName('');
        setFileUrl('');
        setCategory('');
        setShowAdd(false);
      },
      onError: onErr,
    },
  );

  const remove = useApiMutation(
    (documentId: number) =>
      apiClient.delete(`/trainings/documents/${documentId}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Documento eliminado.', intent: 'success' }),
      onError: onErr,
    },
  );

  const handleRemove = async (documentId: number, docName: string) => {
    if (await confirm({ title: `Eliminar "${docName}"?`, destructive: true })) {
      remove.mutate(documentId);
    }
  };

  const documents = training.documents ?? [];
  // Lista base + categorias já usadas nesta formação.
  const categoryOptions = [
    ...new Set([
      ...BASE_CATEGORIES,
      ...documents.map((d) => d.category).filter((c): c is string => !!c),
    ]),
  ];
  const canSubmit = name.trim().length > 0 && fileUrl.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus size={14} strokeWidth={1.75} />
          Adicionar documento
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Nome *" htmlFor="doc-name">
              <Input
                id="doc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Programa da formação"
                variant="underline"
                className="w-full"
              />
            </FormField>
            <FormField label="Ficheiro ou link (URL HTTPS) *" htmlFor="doc-url">
              <FileOrLinkField
                id="doc-url"
                value={fileUrl}
                onChange={(value, fileName) => {
                  setFileUrl(value);
                  if (fileName)
                    setName((n) => n || fileName.replace(/\.[^.]+$/, ''));
                }}
              />
            </FormField>
            <FormField label="Categoria" htmlFor="doc-category">
              <ChoiceOrCustom
                id="doc-category"
                label="Categoria"
                variant="underline"
                icon={Filter}
                value={category}
                options={categoryOptions}
                onChange={setCategory}
                emptyLabel="Sem categoria"
                placeholder="Escreva a categoria"
              />
            </FormField>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              disabled={!canSubmit}
              loading={add.isPending}
              onClick={() => add.mutate(undefined)}
            >
              Guardar
            </Button>
          </div>
        </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sem documentos"
          description="Programa, materiais, listas de presenças e outros documentos administrativos da formação."
        />
      ) : (
        <div className="space-y-3">
          {documents.map((d) => (
            <RowCard
              key={d.id}
              icon={FileText}
              title={
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    // Os browsers bloqueiam a navegação para data URLs: abre
                    // os ficheiros carregados através de um blob.
                    if (d.fileUrl.startsWith('data:')) {
                      e.preventDefault();
                      void openDataUrl(d.fileUrl);
                    }
                  }}
                  className="hover:underline"
                >
                  {d.name}
                </a>
              }
              badges={
                d.category ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1F3D] px-3 py-1 text-sm font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    {d.category}
                  </span>
                ) : undefined
              }
              meta={[
                {
                  icon: User,
                  value: d.uploadedBy?.fullName ?? 'Sistema',
                  label: 'Por',
                },
                { icon: Clock, value: formatDate(d.createdAt), label: 'Data' },
              ]}
              actions={
                <RowCardIconButton
                  icon={Trash2}
                  label={`Eliminar ${d.name}`}
                  danger
                  disabled={remove.isPending && remove.variables === d.id}
                  onClick={() => handleRemove(d.id, d.name)}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
