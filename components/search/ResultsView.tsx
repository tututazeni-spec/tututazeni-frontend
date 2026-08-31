// components/search/ResultsView.tsx

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResultCard } from './ResultCard';
import { TYPE_CONFIG } from './types';
import type { SearchResponse } from './types';

interface ResultsViewProps {
  data: SearchResponse;
  activeType: string;
  setActiveType: (t: string) => void;
}

export function ResultsView({ data, activeType, setActiveType }: ResultsViewProps) {
  const types = Object.keys(data.grouped).filter((t) => (data.grouped[t]?.length ?? 0) > 0);

  const displayResults =
    activeType === 'all' ? Object.values(data.grouped).flat() : (data.grouped[activeType] ?? []);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
      {/* Type sidebar */}
      <div className="md:col-span-1">
        <Card>
          <CardBody className="p-3">
            <Button
              intent={activeType === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveType('all')}
              className="mb-1 w-full justify-between"
            >
              <span>Todos</span>
              <span className="text-[10px]">
                {Object.values(data.counts).reduce((a, b) => a + b, 0)}
              </span>
            </Button>
            {types.map((t) => {
              const conf = TYPE_CONFIG[t];
              if (!conf) return null;
              const Icon = conf.icon;
              const active = activeType === t;
              return (
                <Button
                  key={t}
                  intent={active ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveType(t)}
                  className="mb-0.5 w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Icon size={14} strokeWidth={1.75} className={active ? undefined : conf.color} />
                    {conf.label}
                  </span>
                  <span className="text-[10px]">{data.counts[t] ?? data.grouped[t]?.length ?? 0}</span>
                </Button>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* Results */}
      <div className="md:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-body text-sm text-ink">
            {displayResults.length} resultado(s) para <strong>&quot;{data.query}&quot;</strong>
          </p>
        </div>

        {displayResults.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`Sem resultados para "${data.query}"`}
            description="Tenta um termo diferente."
          />
        ) : (
          <Card className="divide-y divide-border">
            {displayResults.map((r, i) => (
              <ResultCard key={i} result={r} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
