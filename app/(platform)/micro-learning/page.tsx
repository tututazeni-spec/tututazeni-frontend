// src/app/(dashboard)/micro-learning/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/micro-learning/constants';
import { DashboardView } from '@/components/micro-learning/DashboardView';
import { FeedView } from '@/components/micro-learning/FeedView';
import { PlayerView } from '@/components/micro-learning/PlayerView';
import { SavedView } from '@/components/micro-learning/SavedView';
import type { MicroLearning, Nav } from '@/components/micro-learning/types';

export default function MicroLearningPage() {
  const [nav, setNav] = useState<Nav>({ view: 'feed' });

  const handleSelect = (item: MicroLearning) =>
    setNav({ view: 'player', item });
  const handleBack = () => setNav({ view: 'feed' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
          </p>
        </div>
      </div>

      {/* Tabs */}
      {nav.view !== 'player' && (
        <div className="mb-6 flex w-fit gap-1 rounded-control bg-surface-sunken p-1">
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

      {nav.view === 'feed' && <FeedView onSelect={handleSelect} />}
      {nav.view === 'player' && (
        <PlayerView item={nav.item} onBack={handleBack} />
      )}
      {nav.view === 'saved' && <SavedView onSelect={handleSelect} />}
      {nav.view === 'dashboard' && <DashboardView />}
    </div>
  );
}
