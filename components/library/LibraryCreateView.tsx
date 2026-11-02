// components/library/LibraryCreateView.tsx

'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, FileUp, Link2, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/lib/format';
import {
  MAX_UPLOAD_BYTES,
  readAsDataUrl,
} from '@/components/content-library/inlineFile';
import { TYPE_LABELS } from './types';

// Espelha FILE_POLICIES.DOCUMENT do backend (@IsAllowedFileUrl inline em
// CreateItemDto): PDF, Office moderno, imagem e texto, até 5 MB.
const UPLOAD_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
];

interface LibraryCreateForm {
  type: string;
  title: string;
  subtitle: string;
  description: string;
  fileUrl: string;
  author: string;
  publisher: string;
  isbn: string;
  year: string;
  language: string;
  pages: string;
  categoriesText: string;
  keywordsText: string;
}

interface LibraryCreateViewProps {
  form: LibraryCreateForm;
  setField: <K extends keyof LibraryCreateForm>(
    key: K,
    value: LibraryCreateForm[K],
  ) => void;
  error: string;
  saving: boolean;
  submit: (e?: { preventDefault?: () => void }) => void;
  onCancel: () => void;
}

const TYPE_SELECT_ITEMS = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function LibraryCreateView({
  form,
  setField,
  error,
  saving,
  submit,
  onCancel,
}: LibraryCreateViewProps) {
  const [source, setSource] = useState<'url' | 'file'>('url');
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const switchSource = (next: 'url' | 'file') => {
    if (next === source) return;
    setSource(next);
    setFile(null);
    setFileError('');
    setField('fileUrl', '');
  };

  const pickFile = async (f: File | undefined) => {
    setFileError('');
    if (!f) return;
    if (f.size === 0) return setFileError('O ficheiro está vazio.');
    if (f.size > MAX_UPLOAD_BYTES)
      return setFileError(
        `O ficheiro tem ${formatBytes(f.size)} — o máximo é 5 MB.`,
      );
    if (!UPLOAD_MIMES.includes(f.type))
      return setFileError(
        'Tipo não suportado (PDF, Word, Excel, PowerPoint, imagem ou texto).',
      );
    setReading(true);
    try {
      setField('fileUrl', await readAsDataUrl(f));
      setFile({ name: f.name, size: f.size });
    } catch {
      setFileError('Não foi possível ler o ficheiro.');
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="max-w-3xl p-6">
      <Button intent="ghost" size="sm" className="mb-2" onClick={onCancel}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar à biblioteca
      </Button>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Adicionar Recurso
      </h1>

      {error && (
        <div className="mb-4 rounded-card border border-danger bg-danger-subtle p-3 font-body text-sm text-danger-ink">
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <Card>
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Tipo *" htmlFor="library-type">
              <Select
                items={TYPE_SELECT_ITEMS}
                value={form.type}
                onValueChange={(v) => setField('type', v)}
              />
            </FormField>

            <FormField label="Idioma" htmlFor="library-language">
              <Input
                id="library-language"
                value={form.language}
                onChange={(e) => setField('language', e.target.value)}
                className="w-full"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Título *" htmlFor="library-title">
                <Input
                  id="library-title"
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Subtítulo" htmlFor="library-subtitle">
                <Input
                  id="library-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setField('subtitle', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className="font-body text-sm font-medium text-ink">
                Origem do ficheiro *
              </span>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Origem do ficheiro"
              >
                {(
                  [
                    { key: 'url', label: 'Adicionar por URL', icon: Link2 },
                    { key: 'file', label: 'Carregar ficheiro', icon: FileUp },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={source === o.key}
                    onClick={() => switchSource(o.key)}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-control border px-3 py-2 font-body text-sm transition-colors',
                      source === o.key
                        ? 'border-primary bg-primary-subtle text-primary'
                        : 'border-border-strong bg-surface text-ink-muted',
                    )}
                  >
                    <o.icon size={15} strokeWidth={1.75} />
                    {o.label}
                  </button>
                ))}
              </div>

              {source === 'url' ? (
                <FormField label="URL do ficheiro *" htmlFor="library-fileUrl">
                  <Input
                    id="library-fileUrl"
                    required
                    placeholder="https://storage.innova.ao/docs/ficheiro.pdf"
                    value={form.fileUrl}
                    onChange={(e) => setField('fileUrl', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              ) : (
                <FormField
                  label="Ficheiro *"
                  htmlFor="library-file"
                  hint="Tamanho máximo: 5 MB. PDF, Word, Excel, PowerPoint, imagem ou texto."
                  error={fileError || undefined}
                >
                  <input
                    ref={fileInput}
                    id="library-file"
                    type="file"
                    accept={UPLOAD_MIMES.join(',')}
                    className="sr-only"
                    onChange={(e) => {
                      void pickFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  {file ? (
                    <div className="flex items-center gap-3 rounded-control border border-border-strong bg-surface px-3 py-2 text-sm">
                      <FileUp
                        size={16}
                        strokeWidth={1.75}
                        className="shrink-0 text-ink-muted"
                      />
                      <span className="min-w-0 flex-1 truncate text-ink">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-ink-faint">
                        {formatBytes(file.size)}
                      </span>
                      <IconButton
                        icon={X}
                        label="Remover ficheiro"
                        intent="ghostDanger"
                        size="xs"
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setField('fileUrl', '');
                        }}
                      />
                    </div>
                  ) : (
                    <Button
                      intent="secondary"
                      type="button"
                      loading={reading}
                      onClick={() => fileInput.current?.click()}
                    >
                      <FileUp size={15} strokeWidth={1.75} />
                      Escolher ficheiro…
                    </Button>
                  )}
                </FormField>
              )}
            </div>

            <FormField label="Autor" htmlFor="library-author">
              <Input
                id="library-author"
                value={form.author}
                onChange={(e) => setField('author', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="Editora" htmlFor="library-publisher">
              <Input
                id="library-publisher"
                value={form.publisher}
                onChange={(e) => setField('publisher', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="ISBN" htmlFor="library-isbn">
              <Input
                id="library-isbn"
                value={form.isbn}
                onChange={(e) => setField('isbn', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="Ano" htmlFor="library-year">
              <Input
                id="library-year"
                type="number"
                value={form.year}
                onChange={(e) => setField('year', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField label="Páginas" htmlFor="library-pages">
              <Input
                id="library-pages"
                type="number"
                min={1}
                value={form.pages}
                onChange={(e) => setField('pages', e.target.value)}
                className="w-full"
              />
            </FormField>

            <FormField
              label="Categorias (separadas por vírgula)"
              htmlFor="library-categories"
            >
              <Input
                id="library-categories"
                value={form.categoriesText}
                onChange={(e) => setField('categoriesText', e.target.value)}
                className="w-full"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Palavras-chave (separadas por vírgula)"
                htmlFor="library-keywords"
              >
                <Input
                  id="library-keywords"
                  value={form.keywordsText}
                  onChange={(e) => setField('keywordsText', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Descrição" htmlFor="library-description">
                <Textarea
                  id="library-description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </FormField>
            </div>

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={saving || reading}>
                {saving ? 'A guardar...' : 'Adicionar Recurso'}
              </Button>
              <Button type="button" intent="secondary" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
