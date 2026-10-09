'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CircleCheck,
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

           {/* Abas em "glassmorphism": contentor translúcido com desfoque
          (backdrop-blur) e botões em forma de pílula com ícone, título e
          subtítulo. A aba activa usa a mesma condição `nav.view === n.id`
          de sempre para ganhar gradiente azul, sombra e um visto à
          direita. As manchas desfocadas atrás existem só para o efeito de
          vidro ser visível sobre o fundo claro. Escondida na vista de
          detalhe, como antes. */}
      {nav.view !== 'detail' && (
        <div className="relative mb-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          >
            <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="relative rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {visibleNav.map((n) => {
                const meta = NAV_META[n.id];
                const Icon = meta?.icon ?? BookOpen;
                const active = nav.view === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setNav({ view: n.id })}
                    className={`flex items-center gap-3 whitespace-nowrap rounded-full border py-2 pl-2 pr-4 text-left backdrop-blur transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? 'border-transparent bg-[#0F1F3D] text-white shadow-lg'
                        : 'border-white/70 bg-white/60 text-ink shadow-sm duration-200 hover:scale-105 hover:border-primary hover:bg-white/80 hover:shadow-md motion-reduce:hover:scale-100'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-white/70 text-ink/70'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold">{n.label}</span>
                      {meta?.hint && (
                        <span
                          className={`text-xs ${active ? 'opacity-85' : 'opacity-70'}`}
                        >
                          {meta.hint}
                        </span>
                      )}
                    </span>
                    {active && (
                      <CircleCheck
                        size={16}
                        strokeWidth={2}
                        className="shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
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
