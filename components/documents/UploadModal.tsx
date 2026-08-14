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

import { useState } from 'react';
import { AlertCircle, Plus, Upload, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useFormValidation } from '@/hooks/useFormValidation';
import { apiClient } from '@/lib/apiClient';
import { required } from '@/lib/validation';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG } from './constants';
import type { DocCategory, DocSensitivity } from './types';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_ITEMS = Object.entries(CATEGORY_CONFIG).map(([k, v]) => ({
  value: k,
  label: v.label,
}));
const SENSITIVITY_ITEMS = Object.entries(SENSITIVITY_CONFIG).map(
  ([k, v]) => ({ value: k, label: v.label }),
);

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
    },
    { title: [required()], fileUrl: [required()] },
  );
  const [tagInput, setTagInput] = useState('');
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const uploadDoc = useApiMutation(() => apiClient.post('/documents', form), {
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e) => setSubmitError(e.message),
  });
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
          <div className="border-2 border-dashed border-border-strong rounded-panel p-6 text-center hover:border-accent hover:bg-accent-subtle/30 transition-colors cursor-pointer">
            <Upload size={28} strokeWidth={1.75} className="mx-auto text-ink-faint mb-2" />
            <p className="text-sm text-ink-muted">
              Arraste o ficheiro ou clique para carregar
            </p>
            <p className="text-xs text-ink-faint mt-1">
              PDF, DOCX, XLS, imagens — máx. 100MB
            </p>
            <input
              type="text"
              value={form.fileUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, fileUrl: e.target.value }))
              }
              placeholder="(temporário: cole a URL do ficheiro)"
              className="mt-3 w-full px-3 py-1.5 text-xs border border-border-strong rounded-control bg-surface focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-subtle"
            />
          </div>

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
              <Input
                id="upload-department"
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                placeholder="Ex: Tecnologia"
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
