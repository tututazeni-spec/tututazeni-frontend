// src/app/(dashboard)/micro-learning/page.tsx
'use client';

import { useState } from 'react';
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Aprendizagem rápida
          </p>
        </div>
      </div>

      {/* Tabs */}
      {nav.view !== 'player' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
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
