'use client';

import { useState } from 'react';
import { AdminDashboardView } from '@/components/courses/AdminDashboardView';
import { CatalogView } from '@/components/courses/CatalogView';
import { CertificatesView } from '@/components/courses/CertificatesView';
import { NAV, TITLES } from '@/components/courses/constants';
import { CourseDetail } from '@/components/courses/CourseDetail';
import { MyEnrollmentsView } from '@/components/courses/MyEnrollmentsView';
import type { Nav } from '@/components/courses/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';

export default function CoursesPage() {
  const notify = useToast();
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[nav.view]}</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            INNOVA — Academia Corporativa
          </p>
        </div>
        {nav.view === 'catalog' && (
          <Button
            onClick={() =>
              notify({
                title: 'Abrir formulário de criação de curso',
                intent: 'info',
              })
            }
          >
            + Criar curso
          </Button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-control transition-colors ${
                nav.view === n.id
                  ? 'bg-surface text-ink shadow-resting'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <CourseDetail courseId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-courses' && (
        <MyEnrollmentsView onSelect={handleSelect} />
      )}
      {nav.view === 'certificates' && <CertificatesView />}
      {nav.view === 'dashboard' && (
        <AdminDashboardView onSelect={handleSelect} />
      )}
    </div>
  );
}
