'use client';

import { useState } from 'react';
import { AdminDashboardView } from '@/components/courses/AdminDashboardView';
import { CatalogView } from '@/components/courses/CatalogView';
import { CertificatesView } from '@/components/courses/CertificatesView';
import { NAV, TITLES } from '@/components/courses/constants';
import { CourseDetail } from '@/components/courses/CourseDetail';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { GestaoView } from '@/components/courses/GestaoView';
import { MyEnrollmentsView } from '@/components/courses/MyEnrollmentsView';
import type { Nav } from '@/components/courses/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ADMIN_ROLES, type Role } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';

export default function CoursesPage() {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const role = me?.role?.name as Role | undefined;
  // Enquanto a role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-admin — as abas adminOnly aparecem assim que /auth/me resolve.
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const visibleNav = isAdmin ? NAV : NAV.filter((n) => !n.adminOnly);

  const [nav, setNav] = useState<Nav>({ view: 'catalog' });
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[nav.view]}</h1>
          <p className="text-sm text-ink-faint mt-0.5"></p>
        </div>
        {(nav.view === 'catalog' || nav.view === 'gestao') && (
          <Button onClick={() => setShowCreate(true)}>+ Criar curso</Button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
          {visibleNav.map((n) => (
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
      {nav.view === 'dashboard' && isAdmin && (
        <AdminDashboardView onSelect={handleSelect} />
      )}
      {nav.view === 'gestao' && isAdmin && (
        <GestaoView onSelect={handleSelect} />
      )}

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            notify({
              title: 'Curso criado como rascunho. Vê-o na aba Gestão.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
