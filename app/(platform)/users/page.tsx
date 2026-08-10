'use client';

import { useState } from 'react';
import { NAV, TITLES } from '@/components/users/constants';
import { CreateUserView } from '@/components/users/CreateUserView';
import { DashboardView } from '@/components/users/DashboardView';
import { DirectoryView } from '@/components/users/DirectoryView';
import { UserListView } from '@/components/users/UserListView';
import { UserProfile } from '@/components/users/UserProfile';
import type { Nav } from '@/components/users/types';

export default function UsersPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });
  const handleCreate = () => setNav({ view: 'create' });
  const handleCreated = () => setNav({ view: 'list' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Recursos Humanos
          </p>
        </div>
        {nav.view === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
            >
              + Novo colaborador
            </button>
            <button
              onClick={() => alert('Abrir modal de importação CSV/Excel')}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
            >
              ⬆ Importar
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && nav.view !== 'create' && (
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

      {nav.view === 'list' && (
        <UserListView onSelect={handleSelect} onCreate={handleCreate} />
      )}
      {nav.view === 'detail' && (
        <UserProfile userId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'create' && (
        <CreateUserView onBack={handleBack} onCreated={handleCreated} />
      )}
      {nav.view === 'dashboard' && <DashboardView />}
      {nav.view === 'directory' && <DirectoryView onSelect={handleSelect} />}
    </div>
  );
}
