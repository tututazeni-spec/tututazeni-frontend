// components/library/LibraryCreateView.tsx

import { Field } from './shared';
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

export function LibraryCreateView({
  form,
  setField,
  error,
  saving,
  submit,
  onCancel,
}: LibraryCreateViewProps) {
  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={onCancel}
        className="text-sm text-blue-600 hover:underline mb-2"
      >
        ← Voltar à biblioteca
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Adicionar Recurso
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Field label="Tipo *">
          <select
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Idioma">
          <input
            value={form.language}
            onChange={(e) => setField('language', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Título *">
            <input
              required
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Subtítulo">
            <input
              value={form.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="URL do ficheiro *">
            <input
              required
              placeholder="https://storage.innova.ao/docs/ficheiro.pdf"
              value={form.fileUrl}
              onChange={(e) => setField('fileUrl', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <Field label="Autor">
          <input
            value={form.author}
            onChange={(e) => setField('author', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Editora">
          <input
            value={form.publisher}
            onChange={(e) => setField('publisher', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="ISBN">
          <input
            value={form.isbn}
            onChange={(e) => setField('isbn', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Ano">
          <input
            type="number"
            value={form.year}
            onChange={(e) => setField('year', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Páginas">
          <input
            type="number"
            min={1}
            value={form.pages}
            onChange={(e) => setField('pages', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Categorias (separadas por vírgula)">
          <input
            value={form.categoriesText}
            onChange={(e) => setField('categoriesText', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Palavras-chave (separadas por vírgula)">
            <input
              value={form.keywordsText}
              onChange={(e) => setField('keywordsText', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
              rows={4}
            />
          </Field>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'A guardar...' : 'Adicionar Recurso'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
