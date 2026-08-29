// src/app/(dashboard)/development-plans/page.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { NAV, TITLES } from '@/components/development-plans/constants';
import { DetailView } from '@/components/development-plans/DetailView';
import { MyPlansView } from '@/components/development-plans/MyPlansView';
import { TeamView } from '@/components/development-plans/TeamView';
import type { Nav } from '@/components/development-plans/types';
import { Button } from '@/components/ui/Button';

export default function DevelopmentPlansPage() {
  const notify = useToast();
  const [nav, setNav] = useState<Nav>({ view: 'my-plans' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'my-plans' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint"></p>
        </div>
        {nav.view !== 'detail' && (
          <Button
            size="sm"
            onClick={() =>
              notify({
                title: 'Abrir formulário de criação de PDI',
                intent: 'info',
              })
            }
          >
            <Plus size={14} strokeWidth={1.75} />
            Novo PDI
          </Button>
        )}
      </div>

      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
          {NAV.map((n) => (
            <Button
              key={n.id}
              size="sm"
              intent={nav.view === n.id ? 'primary' : 'ghost'}
              onClick={() => setNav({ view: n.id })}
            >
              {n.label}
            </Button>
          ))}
        </div>
      )}

      {nav.view === 'my-plans' && <MyPlansView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView planId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'team' && <TeamView onSelect={handleSelect} />}
    </div>
  );
}
