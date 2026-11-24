// components/payroll/InssRulesCard.tsx
// Cartão "Regras fiscais" (INSS + escalões IRT) no desenho de inss.jpg:
// painel navy à esquerda com escudo, à direita as 4 métricas e a tabela de
// escalões com cabeçalho navy.
'use client';

import { Building2, Coins, FileText, ShieldCheck, User } from 'lucide-react';
import { formatKz as fmtKz } from '@/lib/format';
import type { TaxConfig } from './insightTypes';

const pct = (r: number) => `${(r * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
const NAVY = '#0F1F3D';

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        className="h-9 w-9 shrink-0 text-brand"
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-body text-sm text-ink-muted">{label}</p>
        <p className="font-display text-lg font-bold" style={{ color: NAVY }}>
          {value}
        </p>
      </div>
    </div>
  );
}

const TH =
  'px-4 py-2 text-left font-body text-xs font-bold uppercase tracking-wide text-white';

export function InssRulesCard({ config }: { config: TaxConfig }) {
  const ss = config.socialSecurity;
  return (
    <div
      className="grid overflow-hidden rounded-[18px] shadow-[0_4px_12px_rgba(21,47,89,0.10)] md:grid-cols-[220px_1fr]"
      style={{ backgroundColor: NAVY }}
    >
      {/* Painel esquerdo */}
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
        <ShieldCheck
          className="h-20 w-20 text-[#3B82F6]"
          strokeWidth={1.25}
          aria-hidden
        />
        <p className="font-display text-4xl font-bold text-white">INSS</p>
        <p className="font-body text-sm font-semibold leading-snug text-[#6FA0F5]">
          Contribuições e
          <br />
          Parcelas a Abater
        </p>
      </div>

      {/* Painel direito */}
      <div className="m-2 rounded-[14px] bg-surface p-5 md:ml-0">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Stat
            icon={User}
            label="INSS trabalhador"
            value={pct(ss.employeeRate)}
          />
          <Stat
            icon={Building2}
            label="INSS patronal"
            value={pct(ss.employerRate)}
          />
          <Stat
            icon={FileText}
            label="Tecto INSS"
            value={ss.ceiling ? fmtKz(ss.ceiling) : '—'}
          />
          <Stat
            icon={Coins}
            label="Salário mínimo"
            value={fmtKz(config.minimumWage)}
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-[10px] border border-brand-line">
          <table className="w-full min-w-[520px] font-body text-sm text-ink">
            <thead style={{ backgroundColor: NAVY }}>
              <tr>
                <th className={`${TH} text-right`}>De</th>
                <th className={`${TH} text-right`}>Até</th>
                <th className={TH}>Taxa</th>
                <th className={`${TH} text-right`}>Parcela a abater</th>
              </tr>
            </thead>
            <tbody>
              {config.irtBrackets.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-brand-line last:border-0"
                >
                  <td className="px-4 py-1.5 text-right tabular-nums">
                    {fmtKz(b.min)}
                  </td>
                  <td className="px-4 py-1.5 text-right tabular-nums">
                    {b.max == null ? '∞' : fmtKz(b.max)}
                  </td>
                  <td className="px-4 py-1.5">{pct(b.rate)}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums">
                    {b.deduction ? fmtKz(b.deduction) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
