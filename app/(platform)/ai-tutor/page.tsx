// src/app/(dashboard)/ai-tutor/page.tsx
'use client';

import { useState } from 'react';
import { NAV, TITLES } from '@/components/ai-tutor/constants';
import { ChatView } from '@/components/ai-tutor/ChatView';
import { GenerateView } from '@/components/ai-tutor/GenerateView';
import { HistoryView } from '@/components/ai-tutor/HistoryView';
import { RecommendationsView } from '@/components/ai-tutor/RecommendationsView';
import type { View } from '@/components/ai-tutor/types';

export default function AiTutorPage() {
  const [view, setView] = useState<View>('chat');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Assistente de Aprendizagem Inteligente
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {view === 'chat' && <ChatView />}
      {view === 'generate' && <GenerateView />}
      {view === 'recommendations' && <RecommendationsView />}
      {view === 'history' && <HistoryView />}
    </div>
  );
}
