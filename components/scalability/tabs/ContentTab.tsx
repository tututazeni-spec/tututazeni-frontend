'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardTitleBar } from '../InfraTabs';
import { ContentDeliveryConfigModal } from '../ContentDeliveryConfigModal';
import type {
  FrontendMetricsData,
  PageStatus,
  ContentDeliveryConfig,
} from '../types';
import { MetricTile, SectionHeader } from './shared';

interface ContentTabProps {
  tenantId: string;
  config: ContentDeliveryConfig | null;
  frontend?: FrontendMetricsData | null;
}

// ─── FRONTEND & CDN (modulo_scalability.md §10) ───────────────

const PAGE_STATE: Record<
  PageStatus,
  { label: string; intent: 'success' | 'warning' | 'danger' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

interface PageRow {
  key: string;
  label: string;
  stats: FrontendMetricsData['pages'][number] | null;
}

function PageTable({ rows }: { rows: PageRow[] }) {
  const ms = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : `${Math.round(v)} ms`;
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-body text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="py-1.5 font-semibold">Página</th>
            <th className="py-1.5 text-right font-semibold">Visitas</th>
            <th className="py-1.5 text-right font-semibold">Carregamento</th>
            <th className="py-1.5 text-right font-semibold">LCP</th>
            <th className="py-1.5 text-right font-semibold">TTFB</th>
            <th className="py-1.5 text-right font-semibold">Erros</th>
            <th className="py-1.5 pl-4 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, stats }) => (
            <tr key={key} className="border-t border-border">
              <td className="py-1.5 font-mono text-xs text-ink">{label}</td>
              <td className="py-1.5 text-right text-ink">
                {stats?.views ?? 0}
              </td>
              <td className="py-1.5 text-right text-ink">
                {ms(stats?.loadMs)}
              </td>
              <td className="py-1.5 text-right text-ink">{ms(stats?.lcpMs)}</td>
              <td className="py-1.5 text-right text-ink-muted">
                {ms(stats?.ttfbMs)}
              </td>
              <td className="py-1.5 text-right text-ink-muted">
                {stats?.errors ?? 0}
              </td>
              <td className="py-1.5 pl-4">
                {stats && stats.views > 0 ? (
                  <Badge intent={PAGE_STATE[stats.status].intent} dot={false}>
                    {PAGE_STATE[stats.status].label}
                  </Badge>
                ) : (
                  <Badge intent="neutral" dot={false}>
                    Sem dados
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FrontendPerfSection({ data }: { data: FrontendMetricsData | null }) {
  if (!data) {
    return (
      <EmptyState
        title="A carregar métricas de frontend"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const ms = (v: number | null) => (v === null ? '—' : `${Math.round(v)} ms`);
  const kb = (v: number | null) =>
    v === null ? '—' : `${v.toLocaleString()} KB`;
  const noData = data.samples === 0;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Performance do Frontend"
        sub={`Medições reais dos browsers dos utilizadores — ${data.percentile.toUpperCase()} das últimas ${data.windowHours} h (${data.samples.toLocaleString()} visualizações)`}
      />
      {noData ? (
        <EmptyState
          title="Ainda sem amostras de frontend"
          description="As métricas aparecem depois de os utilizadores navegarem na plataforma."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricTile
            label="Carregamento da pÃ¡gina"
            value={ms(data.vitals.pageLoadMs)}
          />
          <MetricTile
            label="Primeira renderizaÃ§Ã£o de conteÃºdo"
            value={ms(data.vitals.fcpMs)}
            sub="bom ≤ 1800 ms"
          />
          <MetricTile
            label="Maior renderizaÃ§Ã£o de conteÃºdo"
            value={ms(data.vitals.lcpMs)}
            sub="bom ≤ 2500 ms"
          />
          <MetricTile
            label="InteraÃ§Ã£o atÃ© Ã  renderizaÃ§Ã£o seguinte"
            value={ms(data.vitals.inpMs)}
            sub="bom ≤ 200 ms"
          />
          <MetricTile
            label="Tempo atÃ© ao primeiro byte"
            value={ms(data.vitals.ttfbMs)}
            sub="bom ≤ 800 ms"
          />
          <MetricTile
            label="JavaScript (bundle)"
            value={kb(data.resources.jsKb)}
            sub="média por página"
          />
          <MetricTile
            label="CSS"
            value={kb(data.resources.cssKb)}
            sub="média por página"
          />
          <MetricTile
            label="Imagens"
            value={kb(data.resources.imagesKb)}
            sub="média por página"
          />
          <MetricTile
            label="Cache hit ratio"
            value={
              data.resources.cacheHitRatio === null
                ? '—'
                : `${data.resources.cacheHitRatio}%`
            }
            sub="recursos servidos da cache do browser"
          />
          <MetricTile
            label="Pedidos"
            value={
              data.resources.requestsPerPage === null
                ? '—'
                : `${data.resources.requestsPerPage}`
            }
            sub="por página"
          />
          <MetricTile
            label="Erros frontend"
            value={data.errors.total.toLocaleString()}
            sub={`${data.errors.errorRate}% das páginas com erros`}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        <CardTitleBar>Páginas críticas</CardTitleBar>
        <CardBody>
          <PageTable
            rows={data.criticalPages.map((p) => ({
              key: p.path,
              label: p.page,
              stats: p.hasData ? p : null,
            }))}
          />
        </CardBody>
      </Card>

      {!noData && (
        <Card className="overflow-hidden">
          <CardTitleBar>Tempo de carregamento por página</CardTitleBar>
          <CardBody>
            {data.slowPages.length > 0 && (
              <p className="mb-3 font-body text-xs text-ink-muted">
                {data.slowPages.length} página(s) lentas detectadas (≥ 3
                visitas) — candidatas a degradar com grandes volumes de dados.
              </p>
            )}
            <PageTable
              rows={data.pages.map((p) => ({
                key: p.path,
                label: p.path,
                stats: p,
              }))}
            />
            <p className="mt-3 font-body text-xs text-ink-faint">
              Estado: Crítico com LCP &gt; 4 s ou carregamento &gt; 6 s; Atenção
              com LCP &gt; 2,5 s ou carregamento &gt; 3,5 s.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export function ContentTab({
  tenantId,
  config,
  frontend = null,
}: ContentTabProps) {
  const [configuring, setConfiguring] = useState(false);

  if (!config) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Conteúdo & CDN"
              sub="Distribuição de vídeos, SCORM e PDFs com bitrate adaptativo"
            />
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setConfiguring(true)}
            >
              Configurar CDN
            </Button>
          </div>
          {configuring && (
            <ContentDeliveryConfigModal
              tenantId={tenantId}
              config={null}
              onClose={() => setConfiguring(false)}
            />
          )}
          <EmptyState
            title="Sem configuração de entrega de conteúdo"
            description="Este tenant ainda não tem CDN/bitrate adaptativo configurado."
            action={{
              label: 'Configurar CDN',
              onClick: () => setConfiguring(true),
            }}
          />
        </div>
        <FrontendPerfSection data={frontend} />
      </div>
    );
  }

  const rows: { title: string; value: string; active: boolean }[] = [
    {
      title: 'CDN',
      value: config.cdnProvider ?? 'Não configurado',
      active: !!config.cdnProvider,
    },
    {
      title: 'Bitrate Adaptativo',
      value: config.adaptiveBitrate ? 'Activado' : 'Desactivado',
      active: config.adaptiveBitrate,
    },
    {
      title: 'Sincronização Offline',
      value: config.offlineSyncEnabled
        ? `Activada — ${config.maxOfflineDays} dias de cache`
        : 'Desactivada',
      active: config.offlineSyncEnabled,
    },
    {
      title: 'Compressão',
      value: config.compressionEnabled ? 'Activada' : 'Desactivada',
      active: config.compressionEnabled,
    },
    {
      title: 'Formatos Suportados',
      value: config.allowedFormats.join(', ').toUpperCase() || '—',
      active: config.allowedFormats.length > 0,
    },
    {
      title: 'Tamanho Máx. Vídeo',
      value: `${config.maxVideoSizeMb} MB por ficheiro`,
      active: true,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <FrontendPerfSection data={frontend} />
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Conteúdo & CDN"
            sub="Distribuição de vídeos, SCORM e PDFs com bitrate adaptativo"
          />
          <Button
            intent="secondary"
            size="sm"
            onClick={() => setConfiguring(true)}
          >
            Editar Configuração
          </Button>
        </div>
        {configuring && (
          <ContentDeliveryConfigModal
            tenantId={tenantId}
            config={config}
            onClose={() => setConfiguring(false)}
          />
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((item) => (
            <Card key={item.title}>
              <CardBody className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body text-xs text-ink-muted">
                    {item.title}
                  </p>
                  <p className="mt-0.5 font-body text-sm font-semibold text-ink">
                    {item.value}
                  </p>
                </div>
                <Badge
                  intent={item.active ? 'success' : 'neutral'}
                  dot={false}
                  className="shrink-0"
                >
                  {item.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
