'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Award,
  BookOpen,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Tags,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminDashboardView } from '@/components/courses/AdminDashboardView';
import { CatalogView } from '@/components/courses/CatalogView';
import { CertificatesCenter } from '@/components/certificates/CertificatesCenter';
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
import { PillNav } from '@/components/ui/PillTabs';
import { useToast } from '@/providers/ToastProvider';

// Ícone e subtítulo de cada aba, indexados pelo `id` definido em NAV
// (components/courses/constants). O título continua a vir de `n.label`.
// Se algum id não estiver aqui, a aba usa um ícone genérico e fica sem
// subtítulo.
const NAV_META: Record<string, { icon: LucideIcon; hint: string }> = {
  dashboard: { icon: LayoutDashboard, hint: 'Resumo da formação' },
  catalog: { icon: BookOpen, hint: 'Catálogo de cursos' },
  categorias: { icon: Tags, hint: 'Organização por área' },
  inscricoes: { icon: ClipboardList, hint: 'Matrículas e pedidos' },
  progresso: { icon: TrendingUp, hint: 'Evolução dos formandos' },
  turmas: { icon: Users, hint: 'Grupos de formação' },
  'my-courses': { icon: GraduationCap, hint: 'Em curso e concluídos' },
  certificates: { icon: Award, hint: 'Certificações obtidas' },
  relatorios: { icon: FileBarChart, hint: 'Análises e exportações' },
  modulos: { icon: Layers, hint: 'Módulos e lições' },
};

export default function CoursesPage() {
  const notify = useToast();
  const role = useCurrentRole();
  // Enquanto a role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-privilegiado — os separadores restritos aparecem assim que
  // /auth/me resolve.
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const visibleNav = NAV.filter(
    (n) => !n.roles || (!!role && n.roles.includes(role)),
  );

   const [nav, setNav] = useState<Nav>({ view: 'dashboard' });
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
      {/* Banner: a foto ocupa a largura toda (proporção ~3,5:1, por isso
          object-cover recorta pelos lados em ecrãs estreitos e mantém o
          orador ao centro). O gradiente azul-escuro só cobre a metade
          inferior — o ecrã com o gráfico, à esquerda, fica intacto — e dá
          contraste ao título e ao botão. As abas sobem 2rem para cima da
          foto (-mt-8 + z-10) para banner e navegação lerem-se como um bloco. */}
      <header className="relative h-44 overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(15,31,61,0.18)] sm:h-56">
        <Image
          src="/images/cursos.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover object-[40%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0F1F3D]/90 via-[#0F1F3D]/35 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-14 sm:px-7">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {TITLES[nav.view]}
          </h1>
          {nav.view === 'catalog' && isAdmin && (
            <Button onClick={() => setShowCreate(true)}>+ Criar curso</Button>
          )}
        </div>
      </header>

      {/* Abas: mesma barra de pílulas do Dashboard (components/ui/PillTabs),
          para a tipografia (font-body, título + subtítulo) ser única. Escondida
          na vista de detalhe, como antes. */}
      {nav.view !== 'detail' && (
        <PillNav
          className="relative z-10 -mt-8 mb-6 px-3 sm:px-6"
          label="Secções de Cursos"
          items={visibleNav.map((n) => ({
            id: n.id,
            label: n.label,
            hint: NAV_META[n.id]?.hint,
            icon: NAV_META[n.id]?.icon ?? BookOpen,
          }))}
          value={nav.view}
          onChange={(id) => setNav({ view: id as TopLevelView })}
        />
      )}

      {nav.view === 'detail' && <div className="mb-6" />}
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
      {nav.view === 'certificates' && <CertificatesCenter />}
      {nav.view === 'dashboard' && isAdmin && (
        <AdminDashboardView onSelect={handleSelect} />
      )}
      {nav.view === 'inscricoes' && (
        <InscricoesView initialCourseId={enrollmentsCourseId} />
      )}
      {nav.view === 'progresso' && <ProgressoView role={role} />}
      {nav.view === 'modulos' && (
        <ModulosView initialCourseId={modulosCourseId} />
      )}
      {nav.view === 'turmas' && <TurmasView />}
      {nav.view === 'categorias' && <CategoriasView onSelectCourse={handleSelect} />}
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
