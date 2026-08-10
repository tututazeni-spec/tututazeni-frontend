// components/search/ResultsView.tsx

import { Search } from 'lucide-react';
import { ResultCard } from './ResultCard';
import { TYPE_CONFIG } from './types';
import type { SearchResponse } from './types';

interface ResultsViewProps {
  data: SearchResponse;
  activeType: string;
  setActiveType: (t: string) => void;
}

export function ResultsView({
  data,
  activeType,
  setActiveType,
}: ResultsViewProps) {
  const types = Object.keys(data.grouped).filter(
    (t) => (data.grouped[t]?.length ?? 0) > 0,
  );

  const displayResults =
    activeType === 'all'
      ? Object.values(data.grouped).flat()
      : (data.grouped[activeType] ?? []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {/* Type sidebar */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <button
            onClick={() => setActiveType('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 ${activeType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <span>Todos</span>
            <span className="text-[10px]">
              {Object.values(data.counts).reduce((a, b) => a + b, 0)}
            </span>
          </button>
          {types.map((t) => {
            const conf = TYPE_CONFIG[t];
            if (!conf) return null;
            const Icon = conf.icon;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 ${activeType === t ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex items-center gap-2">
                  <Icon
                    size={13}
                    className={activeType === t ? 'text-white' : conf.color}
                  />
                  {conf.label}
                </span>
                <span className="text-[10px]">
                  {data.counts[t] ?? data.grouped[t]?.length ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="md:col-span-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-500">
            {displayResults.length} resultado(s) para{' '}
            <strong>&quot;{data.query}&quot;</strong>
          </p>
        </div>

        {displayResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 py-16 text-center text-slate-400">
            <Search size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              Sem resultados para &quot;{data.query}&quot;
            </p>
            <p className="text-xs mt-1">Tenta um termo diferente</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
            {displayResults.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
