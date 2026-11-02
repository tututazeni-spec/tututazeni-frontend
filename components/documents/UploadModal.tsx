// components/documents/UploadModal.tsx
// Modal de publicação de documento (metadados + upload). Extraído de
// app/(platform)/documents/page.tsx. Migrado para a fundação de design:
// backdrop+painel bespoke passam a Modal/ModalContent (Radix Dialog,
// components/ui/Modal) — mesmo padrão de
// components/work-declaration/CreateModal.tsx; título/descrição/botão
// fechar já vêm de série do ModalContent. Campos passam a
// FormField/Input/Select; tags passam a Badge; mesmos endpoints/payload/
// validação — só apresentação.

'use client';

import { useRef, useState } from 'react';
import { AlertCircle, Plus, Upload, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DepartmentNode } from '@/components/departments/types';
import { useFormValidation } from '@/hooks/useFormValidation';
import { apiClient } from '@/lib/apiClient';
import { required } from '@/lib/validation';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  ACCEPT_ATTR,
  readAsDataUrl,
  validateUpload,
} from '@/components/content-library/inlineFile';
import { formatBytes } from '@/lib/format';
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG } from './constants';
import type { DocCategory, DocSensitivity } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_ITEMS = Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({
  value: k,
  label: v.label,
}));
const SENSITIVITY_ITEMS = Object.entries(SENSITIVITY_CONFIG).map(([k, v]) => ({
  value: k,
  label: v.label,
}));

/** O Select não aceita valor vazio — sentinela para "sem departamento". */
const NO_DEPARTMENT = '__none__';

// O documento guarda o nome do departamento (não o id).
function flattenDepartments(
  nodes: DepartmentNode[],
  depth = 0,
): { value: string; label: string }[] {
  return nodes.flatMap((n) => [
    { value: n.name, label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenDepartments(n.children ?? [], depth + 1),
  ]);
}

export function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      title: '',
      description: '',
      category: 'CORPORATE' as DocCategory,
      sensitivity: 'INTERNAL' as DocSensitivity,
      fileUrl: '',
      mimeType: 'application/pdf',
      fileSize: 0,
      tags: [] as string[],
      expiresAt: '',
      department: '',
      documentNumber: '',
      requiresReadConfirmation: false,
      readDeadlineDays: 15,
      asDraft: false,
    },
    { title: [required()], fileUrl: [required()] },
  );
  const { data: deptTree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const departmentItems = [
    { value: NO_DEPARTMENT, label: 'Sem departamento' },
    ...flattenDepartments(deptTree ?? []),
  ];
  const [tagInput, setTagInput] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateUpload(file);
    if (problem) {
      setSubmitError(problem);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setSubmitError('');
      setFileName(file.name);
      setForm((f) => ({
        ...f,
        fileUrl: dataUrl,
        mimeType: file.type,
        fileSize: file.size,
        title: f.title || file.name.replace(/\.[^.]+$/, ''),
      }));
    } catch {
      setSubmitError('Não foi possível ler o ficheiro.');
    }
  };
  const error = validationError || submitError;

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const uploadDoc = useApiMutation(
    () => {
      const { asDraft, readDeadlineDays, requiresReadConfirmation, ...rest } =
        form;
      return apiClient.post('/documents', {
        ...rest,
        requiresReadConfirmation,
        ...(requiresReadConfirmation && { readDeadlineDays }),
        ...(asDraft && { status: 'DRAFT' }),
      });
    },
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );
  const loading = uploadDoc.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    uploadDoc.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Publicar Documento"
        description="Preencha os metadados"
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={15} strokeWidth={1.75} />
              {error}
            </div>
          )}

          {/* Área de upload */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void pickFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-panel p-6 text-center transition-colors cursor-pointer hover:border-accent hover:bg-accent-subtle/30 ${dragging ? 'border-accent bg-accent-subtle/30' : 'border-border-strong'}`}
          >
            <Upload
              size={28}
              strokeWidth={1.75}
              className="mx-auto text-ink-faint mb-2"
            />
            {fileName ? (
              <p className="text-sm font-medium text-ink">
                {fileName} · {formatBytes(form.fileSize)}
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                Arraste o ficheiro ou clique para carregar
              </p>
            )}
            <p className="text-xs text-ink-faint mt-1">
              PDF, Office, texto e imagens — máx. 5 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                void pickFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          {!fileName && (
            <FormField label="Ou cole a URL do ficheiro" htmlFor="upload-url">
              <Input
                id="upload-url"
                type="text"
                value={form.fileUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fileUrl: e.target.value }))
                }
                placeholder="https://..."
                className="w-full"
              />
            </FormField>
          )}

          <FormField label="Título *" htmlFor="upload-title">
            <Input
              id="upload-title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Categoria" htmlFor="upload-category">
              <Select
                items={CATEGORY_ITEMS}
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as DocCategory }))
                }
                className="w-full"
              />
            </FormField>
            <FormField label="Sensibilidade" htmlFor="upload-sensitivity">
              <Select
                items={SENSITIVITY_ITEMS}
                value={form.sensitivity}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, sensitivity: v as DocSensitivity }))
                }
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Departamento" htmlFor="upload-department">
              <Select
                items={departmentItems}
                value={form.department || NO_DEPARTMENT}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    department: v === NO_DEPARTMENT ? '' : v,
                  }))
                }
                className="w-full"
              />
            </FormField>
            <FormField label="Validade" htmlFor="upload-expires">
              <Input
                id="upload-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Nº do documento" htmlFor="upload-document-number">
            <Input
              id="upload-document-number"
              value={form.documentNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, documentNumber: e.target.value }))
              }
              placeholder="Ex: 12/2026"
              className="w-full"
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
            <Checkbox
              checked={form.asDraft}
              onChange={(e) =>
                setForm((f) => ({ ...f, asDraft: e.target.checked }))
              }
            />
            Guardar como rascunho (inicia fluxo de revisão/aprovação)
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-ink">
            <Checkbox
              checked={form.requiresReadConfirmation}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  requiresReadConfirmation: e.target.checked,
                }))
              }
            />
            Exigir confirmação de leitura
          </label>

          {form.requiresReadConfirmation && (
            <FormField
              label="Prazo para leitura (dias)"
              htmlFor="upload-read-deadline"
            >
              <Input
                id="upload-read-deadline"
                type="number"
                min={1}
                value={form.readDeadlineDays}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    readDeadlineDays: Number(e.target.value),
                  }))
                }
                className="w-full"
              />
            </FormField>
          )}

          <FormField label="Tags" htmlFor="upload-tag-input">
            <div className="flex gap-2">
              <Input
                id="upload-tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
                placeholder="Ex: contrato, 2026"
                className="flex-1"
              />
              <IconButton
                icon={Plus}
                label="Adicionar tag"
                intent="secondary"
                onClick={addTag}
              />
            </div>
          </FormField>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 -mt-2">
              {form.tags.map((t) => (
                <Badge key={t} intent="info">
                  {t}
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        tags: f.tags.filter((x) => x !== t),
                      }))
                    }
                  >
                    <X size={10} strokeWidth={1.75} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          <Button intent="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={loading}>
            {!loading && <Upload size={14} strokeWidth={1.75} />}
            Publicar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
