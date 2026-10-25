// components/career/RequirementChecksPanel.tsx
// Estado de cada requisito estruturado do cargo-alvo no Simulador de
// Carreira (GET /career/me/simulate/:id → requirementChecks). Agrupa por
// categoria; "Sem dados" quando o colaborador ainda não preencheu o separador
// Qualificações do seu perfil.

import type { ReactNode } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ACADEMIC_LEVEL_LABEL } from './types';
import type {
  RequirementCategory,
  RequirementCheck,
  RequirementStatus,
} from './types';

const CATEGORY_ORDER: Array<{ key: RequirementCategory; title: string }> = [
  { key: 'ACADEMIC', title: 'Habilitações académicas' },
  { key: 'EXPERIENCE', title: 'Experiência profissional' },
  { key: 'LANGUAGE', title: 'Idiomas' },
  { key: 'CERTIFICATION', title: 'Certificações e licenças' },
];

const STATUS: Record<RequirementStatus, { label: string; cls: string }> = {
  MET: { label: 'Cumpre', cls: 'bg-[#075FE8] text-white' },
  NOT_MET: { label: 'Não cumpre', cls: 'bg-[#FEE2E2] text-danger-ink' },
  NO_DATA: { label: 'Sem dados', cls: 'bg-brand-soft text-brand/70' },
};

function pretty(value: string | null): string {
  if (value === null) return '—';
  return ACADEMIC_LEVEL_LABEL[value] ?? value;
}

export interface RequirementChecksPanelProps {
  checks: RequirementCheck[];
  /** nº de requisitos sem dados (summary.noData) */
  noData?: number;
}

export function RequirementChecksPanel({
  checks,
  noData = 0,
}: RequirementChecksPanelProps): ReactNode {
  if (checks.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-brand-line bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
      <div className="flex items-center gap-2.5 bg-gradient-to-br from-brand-mid to-brand-dark px-5 py-3.5 text-white">
        <ClipboardCheck size={18} strokeWidth={1.75} />
        <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
          Requisitos do cargo
        </h3>
      </div>
      <div className="space-y-4 p-5">
        {CATEGORY_ORDER.map(({ key, title }) => {
          const rows = checks.filter((c) => c.category === key);
          if (rows.length === 0) return null;
          return (
            <section key={key}>
              <h4 className="mb-1.5 font-body text-xs font-semibold uppercase tracking-wide text-brand/70">
                {title}
              </h4>
              <div className="space-y-1.5">
                {rows.map((c) => (
                  <div
                    key={c.requirementId}
                    className="flex items-center justify-between gap-3 rounded-card border border-brand-line bg-brand-soft/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-body text-sm font-medium text-brand">
                        {c.title}
                        {!c.mandatory && (
                          <span className="ml-1.5 font-normal text-brand/60">
                            (diferencial)
                          </span>
                        )}
                      </div>
                      <div className="font-body text-xs text-brand/60">
                        Exigido: {pretty(c.required)} · Tem: {pretty(c.actual)}
                      </div>
                    </div>
                    <span
                      title={
                        c.status === 'NO_DATA'
                          ? 'Preencha o separador Qualificações do seu perfil'
                          : undefined
                      }
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 font-body text-xs font-semibold',
                        STATUS[c.status].cls,
                      )}
                    >
                      {STATUS[c.status].label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {noData > 0 && (
          <p className="font-body text-xs text-brand/60">
            {noData}{' '}
            {noData === 1 ? 'requisito sem dados' : 'requisitos sem dados'} —
            não
            {noData === 1 ? ' entra' : ' entram'} no cálculo da prontidão.
            Complete o seu perfil no separador Qualificações.
          </p>
        )}
      </div>
    </div>
  );
}
