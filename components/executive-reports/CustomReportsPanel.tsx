// components/executive-reports/CustomReportsPanel.tsx
// Separador "Relatórios Personalizados" (docs/Executive_Reports.md §7 e §8):
// modelos predefinidos + construtor (módulos/indicadores, ordenação, filtros
// globais), pré-visualização, modelos reutilizáveis e geração/exportação.

'use client';

import { useState } from 'react';
import { Eye, FilePlus2, Save, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExportButtons } from './ExportButtons';
import { SectionTables } from './SectionTable';
import { filtersToParams } from './filtersToParams';
import type { ExecutiveFilters } from './dashboardTypes';
import type {
  BuilderSectionOption,
  GeneratedReport,
  PreviewResponse,
  TemplateOption,
} from './reportTypes';

export interface CustomReportsPanelProps {
  filters: ExecutiveFilters;
}

export function CustomReportsPanel({ filters }: CustomReportsPanelProps) {
  const notify = useToast();
  const body = filtersToParams(filters);
  const [selected, setSelected] = useState<string[]>(['kpis']);
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [templateName, setTemplateName] = useState('');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [generated, setGenerated] = useState<GeneratedReport | null>(null);

  const templatesQ = useApiQuery<TemplateOption[]>(
    queryKeys.executiveReports.reportTemplates(),
    '/executive-reports/report-templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const catalogQ = useApiQuery<BuilderSectionOption[]>(
    queryKeys.executiveReports.builderCatalog(),
    '/executive-reports/builder/catalog',
    { staleTime: STALE_TIME.STATIC },
  );

  const config = {
    sections: selected,
    sortBy: sortBy.trim() || undefined,
    sortDir: sortBy.trim() ? sortDir : undefined,
  };
  const onError = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const generateTemplate = useApiMutation(
    (code: string) =>
      apiClient.post<GeneratedReport>('/executive-reports/generate', {
        templateCode: code,
        filters: body,
      }),
    {
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: (r) => {
        setGenerated(r);
        notify({ title: 'Relatório gerado', intent: 'success' });
      },
      onError,
    },
  );
  const previewMutation = useApiMutation(
    (_: void) =>
      apiClient.post<PreviewResponse>('/executive-reports/custom/preview', {
        ...config,
        filters: body,
      }),
    {
      onSuccess: (r) => {
        setGenerated(null);
        setPreview(r);
      },
      onError,
    },
  );
  const generateCustom = useApiMutation(
    (_: void) =>
      apiClient.post<GeneratedReport>('/executive-reports/custom/generate', {
        ...config,
        filters: body,
      }),
    {
      invalidateKeys: [queryKeys.executiveReports.all],
      onSuccess: (r) => {
        setGenerated(r);
        notify({ title: 'Relatório gerado', intent: 'success' });
      },
      onError,
    },
  );
  const saveTemplate = useApiMutation(
    (_: void) =>
      apiClient.post('/executive-reports/custom/templates', {
        name: templateName.trim(),
        config: { ...config, filters: body },
      }),
    {
      invalidateKeys: [queryKeys.executiveReports.reportTemplates()],
      onSuccess: () => {
        setTemplateName('');
        notify({ title: 'Modelo guardado', intent: 'success' });
      },
      onError,
    },
  );
  const deleteTemplate = useApiMutation(
    (id: number) =>
      apiClient.delete(`/executive-reports/custom/templates/${id}`),
    {
      invalidateKeys: [queryKeys.executiveReports.reportTemplates()],
      onError,
    },
  );

  const toggle = (key: string) =>
    setSelected((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );

  if (templatesQ.isLoading || catalogQ.isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="h-40 rounded-card bg-surface-sunken"
      />
    );
  if (templatesQ.error || catalogQ.error)
    return (
      <QueryError
        error={templatesQ.error ?? catalogQ.error}
        onRetry={() => {
          templatesQ.refetch();
          catalogQ.refetch();
        }}
      />
    );

  const templates = templatesQ.data ?? [];
  const predefined = templates.filter((t) => t.predefined);
  const saved = templates.filter((t) => !t.predefined);
  const catalog = catalogQ.data ?? [];
  const canSubmit = selected.length > 0;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Modelos predefinidos
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {predefined.map((t) => (
            <Card key={t.code} className="flex flex-col justify-between p-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-body text-sm font-semibold text-ink">
                    {t.name}
                  </div>
                  <Badge intent="neutral" dot={false}>
                    v{t.version}
                  </Badge>
                </div>
                <p className="mt-1 font-body text-xs text-ink-muted">
                  {t.description}
                </p>
              </div>
              <Button
                size="sm"
                className="mt-3 self-start"
                loading={
                  generateTemplate.isPending &&
                  generateTemplate.variables === t.code
                }
                disabled={generateTemplate.isPending}
                onClick={() => generateTemplate.mutate(t.code)}
              >
                <FilePlus2 size={14} strokeWidth={1.75} />
                Gerar com os filtros actuais
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Construtor de relatório personalizado
        </h2>
        <Card className="space-y-4 p-5">
          <div>
            <div className="mb-2 font-body text-xs font-medium text-ink">
              1. Módulos e indicadores
            </div>
            <div className="flex flex-wrap gap-2">
              {catalog.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  aria-pressed={selected.includes(s.key)}
                  className={cn(
                    'rounded-pill border px-3 py-1 font-body text-xs transition-colors',
                    selected.includes(s.key)
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border text-ink-muted hover:border-border-strong',
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label
                htmlFor="cr-sort"
                className="mb-1 block font-body text-xs font-medium text-ink"
              >
                2. Ordenar por coluna (opcional)
              </label>
              <Input
                id="cr-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                placeholder="ex.: headcount"
              />
            </div>
            <div>
              <label
                htmlFor="cr-dir"
                className="mb-1 block font-body text-xs font-medium text-ink"
              >
                Sentido
              </label>
              <select
                id="cr-dir"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                className="w-full rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink"
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
            <p className="self-end font-body text-xs text-ink-faint">
              Período, unidade, departamento e restantes filtros vêm da barra de
              filtros acima.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <Button
              intent="secondary"
              size="sm"
              loading={previewMutation.isPending}
              disabled={!canSubmit}
              onClick={() => previewMutation.mutate()}
            >
              <Eye size={14} strokeWidth={1.75} />
              Pré-visualizar
            </Button>
            <Button
              size="sm"
              loading={generateCustom.isPending}
              disabled={!canSubmit}
              onClick={() => generateCustom.mutate()}
            >
              <FilePlus2 size={14} strokeWidth={1.75} />
              Gerar e guardar
            </Button>
            <div className="ml-auto flex items-end gap-2">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nome do modelo"
                aria-label="Nome do modelo"
              />
              <Button
                intent="secondary"
                size="sm"
                loading={saveTemplate.isPending}
                disabled={!canSubmit || templateName.trim().length < 3}
                onClick={() => saveTemplate.mutate()}
              >
                <Save size={14} strokeWidth={1.75} />
                Guardar modelo
              </Button>
            </div>
          </div>
        </Card>

        {saved.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 font-body text-xs font-medium text-ink">
              Modelos guardados
            </div>
            <div className="flex flex-wrap gap-2">
              {saved.map((t) => (
                <div
                  key={t.code}
                  className="flex items-center gap-1 rounded-pill border border-border px-3 py-1"
                >
                  <button
                    type="button"
                    className="font-body text-xs text-ink hover:text-primary"
                    onClick={() => {
                      if (t.config) setSelected(t.config.sections);
                      setSortBy(t.config?.sortBy ?? '');
                      setSortDir(t.config?.sortDir ?? 'asc');
                    }}
                  >
                    {t.name} · v{t.version}
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar modelo ${t.name}`}
                    className="text-ink-faint hover:text-danger"
                    onClick={() => t.id && deleteTemplate.mutate(t.id)}
                  >
                    <Trash2 size={12} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {generated && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              {generated.title}
            </h2>
            <ExportButtons reportId={generated.id} />
          </div>
          <SectionTables
            sections={generated.sections}
            omitted={generated.omitted}
          />
        </section>
      )}

      {!generated && preview && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">
            Pré-visualização
          </h2>
          <SectionTables
            sections={preview.sections}
            omitted={preview.omitted}
          />
        </section>
      )}
    </div>
  );
}
