// components/certification/TemplatesView.tsx

import { TEMPLATE_TYPES } from './types';
import type { Template, TemplateForm } from './types';

interface TemplatesViewProps {
  data: Template[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  showForm: boolean;
  setShowForm: (updater: (s: boolean) => boolean) => void;
  form: TemplateForm;
  setForm: (form: TemplateForm) => void;
  submit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function TemplatesView({
  data,
  loading,
  error,
  onRetry,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  saving,
}: TemplatesViewProps) {
  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={onRetry} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Templates de Certificado
          </h1>
          <p className="text-gray-500">{data.length} templates</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Novo Template'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <label className="block">
            <span className="text-xs text-gray-500 uppercase">Nome *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 uppercase">Tipo</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mt-1"
            >
              {TEMPLATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-gray-500 uppercase">Descrição</span>
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full mt-1"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-gray-500 uppercase">
              HTML ({'{{recipientName}}'}, {'{{title}}'}, {'{{date}}'})
            </span>
            <textarea
              required
              value={form.html}
              onChange={(e) => setForm({ ...form, html: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full mt-1 font-mono text-sm"
              rows={4}
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 uppercase">Signatário</span>
            <input
              value={form.signatoryName}
              onChange={(e) =>
                setForm({ ...form, signatoryName: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 uppercase">
              Cargo do signatário
            </span>
            <input
              value={form.signatoryTitle}
              onChange={(e) =>
                setForm({ ...form, signatoryTitle: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 uppercase">
              Validade (dias)
            </span>
            <input
              type="number"
              value={form.validityDays}
              onChange={(e) =>
                setForm({ ...form, validityDays: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full mt-1"
            />
          </label>
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
            />
            <span className="text-sm text-gray-600">
              Template por omissão para este tipo
            </span>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Criar Template'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {data.length === 0 ? (
          <p className="p-4 text-gray-400">Sem templates criados</p>
        ) : (
          data.map((t) => (
            <div key={t.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {t.name}
                  {t.isDefault && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Padrão
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {t.type}
                  {t.validityDays
                    ? ` · válido ${t.validityDays} dias`
                    : ' · sem expiração'}
                  {' · '}
                  {t._count?.certificates ?? 0} emitidos
                </p>
              </div>
              <span
                className={`text-xs font-medium ${
                  t.isActive ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {t.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
