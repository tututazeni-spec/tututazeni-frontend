'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const TYPES: Record<string, string> = {
  PDF: 'PDF',
  EBOOK: 'E-book',
  VIDEO: 'Vídeo',
  AUDIO: 'Áudio',
  PRESENTATION: 'Apresentação',
  SPREADSHEET: 'Folha de cálculo',
  DOCUMENT: 'Documento',
  IMAGE: 'Imagem',
  LINK: 'Link',
  SCORM: 'SCORM',
  OTHER: 'Outro',
};

export default function NovoRecursoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'PDF',
    title: '',
    subtitle: '',
    description: '',
    fileUrl: '',
    author: '',
    publisher: '',
    isbn: '',
    year: '',
    language: 'pt',
    pages: '',
    categoriesText: '',
    keywordsText: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        type: form.type,
        title: form.title,
        fileUrl: form.fileUrl,
        language: form.language,
      };
      if (form.subtitle) payload.subtitle = form.subtitle;
      if (form.description) payload.description = form.description;
      if (form.author) payload.author = form.author;
      if (form.publisher) payload.publisher = form.publisher;
      if (form.isbn) payload.isbn = form.isbn;
      if (form.year) payload.year = Number(form.year);
      if (form.pages) payload.pages = Number(form.pages);
      if (form.categoriesText)
        payload.categories = form.categoriesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      if (form.keywordsText)
        payload.keywords = form.keywordsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

      const res = await fetch(`${API}/library/items`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: 'Erro ao adicionar recurso' }));
        throw new Error(
          Array.isArray(err.message) ? err.message.join(', ') : err.message,
        );
      }
      const created = await res.json();
      router.push(`/library/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => router.push('/library')}
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
            onChange={(e) => set('type', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            {Object.entries(TYPES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Idioma">
          <input
            value={form.language}
            onChange={(e) => set('language', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Título *">
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Subtítulo">
            <input
              value={form.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
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
              onChange={(e) => set('fileUrl', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <Field label="Autor">
          <input
            value={form.author}
            onChange={(e) => set('author', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Editora">
          <input
            value={form.publisher}
            onChange={(e) => set('publisher', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="ISBN">
          <input
            value={form.isbn}
            onChange={(e) => set('isbn', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Ano">
          <input
            type="number"
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Páginas">
          <input
            type="number"
            min={1}
            value={form.pages}
            onChange={(e) => set('pages', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Categorias (separadas por vírgula)">
          <input
            value={form.categoriesText}
            onChange={(e) => set('categoriesText', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Palavras-chave (separadas por vírgula)">
            <input
              value={form.keywordsText}
              onChange={(e) => set('keywordsText', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
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
            onClick={() => router.push('/library')}
            className="px-6 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
