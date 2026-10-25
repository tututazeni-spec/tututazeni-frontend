// components/roi-impact/CorrelationAnalysisCard.tsx
// Card de cada uma das 7 análises de correlação. Reutiliza a linguagem do
// RoiTotalCard (painel escuro em gradiente, anel, bloco de leitura) com um
// matiz próprio por análise. O anel mostra |coeficiente| da última execução.

'use client';

import {
  Clock,
  Crown,
  HeartHandshake,
  Play,
  Rocket,
  Target,
  TrendingDown,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/Button';
import { correlationStrengthLabel } from './utils';
import type {
  CorrelationDefinition,
  CorrelationRow,
  CorrelationType,
} from './types';

interface Theme {
  gradient: string;
  shadow: string;
  accent: string;
  accentEnd: string;
  icon: LucideIcon;
}

const THEMES: Record<CorrelationType, Theme> = {
  HORAS_FORMACAO_DESEMPENHO: {
    gradient: 'from-brand via-brand-mid to-brand-dark',
    shadow: 'shadow-[0_8px_24px_rgba(15,31,61,0.25)]',
    accent: '#7CC4FF',
    accentEnd: '#2F80ED',
    icon: Clock,
  },
  COMPETENCIAS_PRODUTIVIDADE: {
    gradient: 'from-[#231245] via-[#4A1D96] to-[#2E1065]',
    shadow: 'shadow-[0_8px_24px_rgba(46,16,101,0.25)]',
    accent: '#C4B5FD',
    accentEnd: '#8B5CF6',
    icon: Target,
  },
  PDI_RETENCAO: {
    gradient: 'from-[#052E26] via-[#065F46] to-[#064E3B]',
    shadow: 'shadow-[0_8px_24px_rgba(6,78,59,0.25)]',
    accent: '#6EE7B7',
    accentEnd: '#10B981',
    icon: HeartHandshake,
  },
  INVESTIMENTO_ROTATIVIDADE: {
    gradient: 'from-[#3B1D06] via-[#92400E] to-[#78350F]',
    shadow: 'shadow-[0_8px_24px_rgba(120,53,15,0.25)]',
    accent: '#FCD34D',
    accentEnd: '#F59E0B',
    icon: TrendingDown,
  },
  ONBOARDING_TEMPO_PRODUTIVIDADE: {
    gradient: 'from-[#042F3A] via-[#0E7490] to-[#164E63]',
    shadow: 'shadow-[0_8px_24px_rgba(22,78,99,0.25)]',
    accent: '#67E8F9',
    accentEnd: '#06B6D4',
    icon: Rocket,
  },
  MENTORIA_PROGRESSAO_CARREIRA: {
    gradient: 'from-[#3F0A1D] via-[#9F1239] to-[#881337]',
    shadow: 'shadow-[0_8px_24px_rgba(136,19,55,0.25)]',
    accent: '#FDA4AF',
    accentEnd: '#F43F5E',
    icon: Users,
  },
  LIDERANCA_ENGAGEMENT_EQUIPA: {
    gradient: 'from-[#3B0A3F] via-[#86198F] to-[#701A75]',
    shadow: 'shadow-[0_8px_24px_rgba(112,26,117,0.25)]',
    accent: '#F0ABFC',
    accentEnd: '#D946EF',
    icon: Crown,
  },
};

interface CorrelationAnalysisCardProps {
  definition: CorrelationDefinition;
  /** Última execução desta análise, se existir. */
  latest?: CorrelationRow;
  onRun: () => void;
}

export function CorrelationAnalysisCard({
  definition,
  latest,
  onRun,
}: CorrelationAnalysisCardProps) {
  const gid = useId();
  const theme = THEMES[definition.type];
  const Icon = theme.icon;

  const coef = latest?.coefficient ?? null;
  const size = 88;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = coef != null ? Math.min(1, Math.abs(coef)) : 0;

  return (
    <div
      className={`transition-transform duration-200 ease-out hover:scale-[1.06] motion-reduce:hover:scale-100 flex flex-col overflow-hidden rounded-panel bg-gradient-to-br ${theme.gradient} ${theme.shadow} p-4 text-white`}
    >
      <div className="mb-2 flex min-h-[3.75rem] items-start gap-3">
        <Icon
          className="mt-0.5 h-6 w-6 shrink-0"
          strokeWidth={1.8}
          aria-hidden
        />
        <h5
          title={definition.label}
          className="line-clamp-3 font-display text-base font-bold leading-tight"
        >
          {definition.label}
        </h5>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={
              coef != null
                ? `Coeficiente de correlação: ${coef}`
                : 'Análise ainda não executada'
            }
            className="-rotate-90"
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.accent} />
                <stop offset="100%" stopColor={theme.accentEnd} />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={stroke}
            />
            {pct > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={`url(#${gid})`}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${pct * circ} ${circ}`}
              />
            )}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold">
            {coef != null ? coef : '–'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-sm text-white/70">
            {coef != null ? 'Última leitura' : 'Sem execuções'}
          </p>
          <p
            className="font-display text-lg font-semibold"
            style={{ color: theme.accent }}
          >
            {coef != null
              ? `Correlação ${correlationStrengthLabel(coef)}`
              : 'Por executar'}
          </p>
          {latest?.pValue != null && (
            <p className="font-body text-xs text-white/70">
              p = {latest.pValue} · amostra {latest.sampleSize}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex-1 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
        <p>{definition.description}</p>
        <p className="mt-1 text-xs text-white/70">
          {definition.xLabel} ↔ {definition.yLabel}
        </p>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          intent="secondary"
          onClick={onRun}
          aria-label={`Executar ${definition.label}`}
        >
          <Play size={13} strokeWidth={1.75} className="mr-1" />
          Executar
        </Button>
      </div>
    </div>
  );
}
