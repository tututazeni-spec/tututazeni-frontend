// components/career-plans/TeamTab.tsx
// Tab "Equipa" — placeholder estático. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { Users } from 'lucide-react';

export function TeamTab() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
      <Users size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">
        Vista de equipa disponível com role Gestor+
      </p>
      <p className="text-xs mt-1">
        Planos, readiness e pedidos de promoção da equipa
      </p>
    </div>
  );
}
