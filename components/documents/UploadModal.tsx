// components/documents/UploadModal.tsx
// Modal de publicação de documento (metadados + upload). Extraído de
// app/(platform)/documents/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Plus, Upload, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useFormValidation } from '@/hooks/useFormValidation';
import { apiClient } from '@/lib/apiClient';
import { required } from '@/lib/validation';
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG } from './constants';
import type { DocCategory, DocSensitivity } from './types';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Publicar Documento</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Preencha os metadados
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Área de upload */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer">
            <Upload size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Arraste o ficheiro ou clique para carregar
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOCX, XLS, imagens — máx. 100MB
            </p>
            <input
              type="text"
              value={form.fileUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, fileUrl: e.target.value }))
              }
              placeholder="(temporário: cole a URL do ficheiro)"
              className="mt-3 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as DocCategory,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sensibilidade
              </label>
              <select
                value={form.sensitivity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sensitivity: e.target.value as DocSensitivity,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.entries(SENSITIVITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Departamento
              </label>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                placeholder="Ex: Tecnologia"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Validade
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
                placeholder="Ex: contrato, 2026"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTag}
                aria-label="Adicionar tag"
                className="px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600"
              >
                <Plus size={14} />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {t}
                    <button
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          tags: f.tags.filter((x) => x !== t),
                        }))
                      }
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}{' '}
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
