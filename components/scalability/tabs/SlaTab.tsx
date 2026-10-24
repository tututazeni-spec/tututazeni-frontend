'use client';

import { useId, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Info, ShieldCheck } from 'lucide-react';
import { SlaConfigModal } from '../SlaConfigModal';
import type { DashboardData, SlaConfig } from '../types';
import { SectionHeader, formatPercent } from './shared';

interface SlaTabProps {
  data: DashboardData;
  slaConfigs: SlaConfig[];
}

export function SlaTab({ data, slaConfigs }: SlaTabProps) {
  const { slaCompliance: s, tenantInfo: t } = data;
  const [configuring, setConfiguring] = useState(false);
  const complianceScore = Math.min(
    100,
    (s.currentUptimePercent / s.slaTarget) * 100,
  );
  const slaGid = useId();
  const statusColor = s.isBreached ? '#F87171' : '#34D399';
  const slaRing = (() => {
    const size = 120;
    const stroke = 16;
    const r = (size - stroke) / 2;
    return { size, stroke, r, circ: 2 * Math.PI * r };
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="SLA & Compliance"
          sub="Monitorização de acordos de nível de serviço e conformidade regulatória"
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setConfiguring(true)}
        >
          Nova Configuração de SLA
        </Button>
      </div>

      {configuring && (
        <SlaConfigModal tenantId={t.id} onClose={() => setConfiguring(false)} />
      )}

      {/* Conformidade SLA — desenho do card "ROI Total" */}
      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="mb-2 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.8} aria-hidden />
          <h3 className="font-display text-base font-bold uppercase tracking-wide">
            Conformidade SLA
          </h3>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
          <div
            className="relative shrink-0"
            style={{ width: slaRing.size, height: slaRing.size }}
          >
            <svg
              width={slaRing.size}
              height={slaRing.size}
              viewBox={`0 0 ${slaRing.size} ${slaRing.size}`}
              role="img"
              aria-label={`Conformidade SLA: ${complianceScore.toFixed(0)}%`}
              className="-rotate-90"
            >
              <defs>
                <linearGradient id={slaGid} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7CC4FF" />
                  <stop offset="100%" stopColor="#2F80ED" />
                </linearGradient>
              </defs>
              <circle
                cx={slaRing.size / 2}
                cy={slaRing.size / 2}
                r={slaRing.r}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={slaRing.stroke}
              />
              <circle
                cx={slaRing.size / 2}
                cy={slaRing.size / 2}
                r={slaRing.r}
                fill="none"
                stroke={`url(#${slaGid})`}
                strokeWidth={slaRing.stroke}
                strokeLinecap="round"
                strokeDasharray={`${(complianceScore / 100) * slaRing.circ} ${slaRing.circ}`}
                opacity={s.isBreached ? 0.55 : 1}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">
              {complianceScore.toFixed(0)}%
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-2 font-display text-xl font-bold leading-snug">
              Cumprimento do acordo de nível de serviço
            </p>
            <div className="flex flex-wrap items-stretch gap-x-8 gap-y-2">
              <div>
                <p className="font-body text-sm text-white/70">Estado</p>
                <p
                  className="mt-1 flex items-center gap-2 font-display text-xl font-semibold"
                  style={{ color: statusColor }}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                  {s.isBreached ? 'SLA Violado' : 'SLA Cumprido'}
                </p>
              </div>
              <div className="hidden w-px bg-white/20 sm:block" />
              <div>
                <p className="font-body text-sm text-white/70">Uptime actual</p>
                <p className="font-display text-2xl font-bold">
                  {formatPercent(s.currentUptimePercent, 3)}
                </p>
              </div>
              <div className="hidden w-px bg-white/20 sm:block" />
              <div>
                <p className="font-body text-sm text-white/70">Meta</p>
                <p className="font-display text-xl font-bold">
                  {formatPercent(s.slaTarget, 1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
          <Info className="h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
          <span>
            {s.isBreached
              ? `O uptime actual está abaixo da meta contratada de ${formatPercent(s.slaTarget, 1)}.`
              : `O uptime actual cumpre a meta contratada de ${formatPercent(s.slaTarget, 1)}.`}
          </span>
        </div>
      </div>

      {/* SLA configurados — dados reais de SlaConfig, não uma checklist de
          certificações fabricada (não existe nenhum modelo de compliance
          LGPD/GDPR/ISO27001 no schema; mostrar isso como "Conforme" seria
          inventar um estado legal que ninguém verificou). */}
      <SectionHeader
        title="Configurações de SLA"
        sub="Contratos activos para este tenant"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {slaConfigs.map((sla) => (
          <Card key={sla.id}>
            <CardBody>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-body text-sm font-semibold text-ink">
                  {sla.name}
                </p>
                <Badge
                  intent={sla.isActive ? 'success' : 'neutral'}
                  dot={false}
                >
                  {sla.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-xs text-ink-muted">
                <span>Uptime mínimo</span>
                <span className="text-right text-ink">
                  {formatPercent(sla.uptimePercent, 2)}
                </span>
                <span>Latência máx.</span>
                <span className="text-right text-ink">
                  {sla.maxLatencyMs}ms
                </span>
                <span>Taxa de erro máx.</span>
                <span className="text-right text-ink">
                  {formatPercent(sla.maxErrorRate * 100, 2)}
                </span>
                <span>Resposta a incidentes</span>
                <span className="text-right text-ink">
                  {sla.incidentResponse}min
                </span>
                {sla.rpoMinutes != null && (
                  <>
                    <span>RPO</span>
                    <span className="text-right text-ink">
                      {sla.rpoMinutes}min
                    </span>
                  </>
                )}
                {sla.rtoMinutes != null && (
                  <>
                    <span>RTO</span>
                    <span className="text-right text-ink">
                      {sla.rtoMinutes}min
                    </span>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
        {slaConfigs.length === 0 && (
          <EmptyState
            className="md:col-span-2"
            title="Sem SLA configurado"
            description="Cria uma configuração de SLA para definir metas de uptime, latência e resposta a incidentes."
          />
        )}
      </div>
    </div>
  );
}
