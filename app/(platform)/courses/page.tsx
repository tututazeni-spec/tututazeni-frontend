'use client';

import { useEffect, useState } from 'react';
import { AdminDashboardView } from '@/components/courses/AdminDashboardView';
import { CatalogView } from '@/components/courses/CatalogView';
import { CertificatesView } from '@/components/courses/CertificatesView';
import { NAV, TITLES } from '@/components/courses/constants';
import { CourseDetail } from '@/components/courses/CourseDetail';
import { CreateCourseModal } from '@/components/courses/CreateCourseModal';
import { GestaoView } from '@/components/courses/GestaoView';
import { InscricoesView } from '@/components/courses/InscricoesView';
import { CategoriasView } from '@/components/courses/CategoriasView';
import { ModulosView } from '@/components/courses/ModulosView';
import { MyEnrollmentsView } from '@/components/courses/MyEnrollmentsView';
import { ProgressoView } from '@/components/courses/ProgressoView';
import { RelatoriosView } from '@/components/courses/RelatoriosView';
import { TurmasView } from '@/components/courses/TurmasView';
import type { Nav, TopLevelView } from '@/components/courses/types';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';

export default function CoursesPage() {
  const notify = useToast();
  const role = useCurrentRole();
  // Enquanto a role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-privilegiado — os separadores restritos aparecem assim que
  // /auth/me resolve.
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const visibleNav = NAV.filter((n) => !n.roles || (!!role && n.roles.includes(role)));

  const [nav, setNav] = useState<Nav>({ view: 'catalog' });
  const [showCreate, setShowCreate] = useState(false);
  // Curso pré-seleccionado ao entrar na aba "Módulos & Lições" — via
  // "Gerir módulos" na aba Cursos (handleManageModules), "Ver inscrições"
  // (handleViewEnrollments) ou via deep-link ?courseId= (ver useEffect
  // abaixo e o redirect em app/(platform)/courses/modulos/page.tsx, mantido
  // para bookmarks antigos ao antigo separador próprio de sidebar).
  const [modulosCourseId, setModulosCourseId] = useState<number | undefined>(
    undefined,
  );
  const [enrollmentsCourseId, setEnrollmentsCourseId] = useState<
    number | undefined
  >(undefined);

  // Lê ?tab=&courseId= do URL no arranque (não usa useSearchParams() para
  // não obrigar a envolver a página num <Suspense> — mesmo raciocínio da
  // antiga app/(platform)/courses/modulos/page.tsx).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TopLevelView | null;
    if (tab && NAV.some((n) => n.id === tab)) {
      setNav({ view: tab });
    }
    const courseId = params.get('courseId');
    if (courseId && /^\d+$/.test(courseId)) {
      setModulosCourseId(Number(courseId));
    }
  }, []);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });
  const handleManageModules = (id: number) => {
    setModulosCourseId(id);
    setNav({ view: 'modulos' });
  };
  const handleViewEnrollments = (id: number) => {
    setEnrollmentsCourseId(id);
    setNav({ view: 'inscricoes' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">{TITLES[nav.view]}</h1>
          <p className="text-sm text-ink-faint mt-0.5"></p>
        </div>
        {nav.view === 'catalog' && isAdmin && (
          <Button onClick={() => setShowCreate(true)}>+ Criar curso</Button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit flex-wrap">
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

      {nav.view === 'catalog' &&
        (isAdmin ? (
          <GestaoView
            onSelect={handleSelect}
            onManageModules={handleManageModules}
            onViewEnrollments={handleViewEnrollments}
          />
        ) : (
          <CatalogView onSelect={handleSelect} />
        ))}
      {nav.view === 'detail' && (
        <CourseDetail courseId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-courses' && (
        <MyEnrollmentsView onSelect={handleSelect} />
      )}
      {nav.view === 'certificates' && <CertificatesView />}
      {nav.view === 'dashboard' && isAdmin && (
        <AdminDashboardView
          onSelect={handleSelect}
          onNavigate={(view) => setNav({ view })}
          onCreateCourse={() => setShowCreate(true)}
        />
      )}
      {nav.view === 'inscricoes' && (
        <InscricoesView initialCourseId={enrollmentsCourseId} />
      )}
      {nav.view === 'progresso' && <ProgressoView role={role} />}
      {nav.view === 'modulos' && (
        <ModulosView initialCourseId={modulosCourseId} />
      )}
      {nav.view === 'turmas' && <TurmasView />}
      {nav.view === 'categorias' && <CategoriasView />}
      {nav.view === 'relatorios' && <RelatoriosView onSelect={handleSelect} />}

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            notify({
              title: 'Curso criado como rascunho. Vê-o na aba Cursos.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
