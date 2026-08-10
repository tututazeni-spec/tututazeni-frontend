// components/work-declaration/StatCard.tsx
// Cartão de KPI do dashboard de declarações. Extraído de
// app/(platform)/work-declaration/page.tsx.

'use client';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111827] border border-white/5 p-5 flex flex-col gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
      {/* subtle glow */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 ${accent}`}
      />
    </div>
  );
}
