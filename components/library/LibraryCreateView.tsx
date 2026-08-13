// components/library/LibraryCreateView.tsx

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { TYPE_LABELS } from './types';

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
  return (
    <div className="max-w-3xl p-6">
      <Button intent="ghost" size="sm" className="mb-2" onClick={onCancel}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar à biblioteca
      </Button>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Adicionar Recurso</h1>

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

            <div className="md:col-span-2">
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

            <FormField label="Categorias (separadas por vírgula)" htmlFor="library-categories">
              <Input
                id="library-categories"
                value={form.categoriesText}
                onChange={(e) => setField('categoriesText', e.target.value)}
                className="w-full"
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Palavras-chave (separadas por vírgula)" htmlFor="library-keywords">
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
              <Button type="submit" disabled={saving}>
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
