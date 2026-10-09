'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/apiClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, filterNavSections, type Role } from '@/lib/roles';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Star,
  Award,
  Briefcase,
  BarChart2,
  FileText,
  Bell,
  Shield,
  Bot,
  Presentation,
  GraduationCap,
  Calendar,
  UserCheck,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Play,
  Database,
  Globe,
  Target,
  PieChart,
  Clock,
  MessageSquare,
  Library,
  DollarSign,
  Activity,
  Download,
  Building2,
  LogOut,
  Wallet,
  Handshake,
  Crown,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  /** Omitido = sem @Roles() no endpoint principal da página → visível a todos.
   *  Confirmado por leitura directa dos controllers, não adivinhado — ver
   *  memory project_innova_sidebar_rbac para a fonte de cada restrição. */
  roles?: readonly Role[];
}

const NAV: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Principal',
    items: [
      {
        href: '/dashboard-rh',
        icon: Users,
        label: 'Dashboard RH',
        roles: ['ADMIN', 'RH', 'DIRECTOR'],
      },
      {
        href: '/analytics',
        icon: BarChart2,
        label: 'Indicadores de Desempenho',
        roles: ['ADMIN', 'RH', 'GESTOR'],
      },
      {
        href: '/reports',
        icon: FileText,
        label: 'Relatórios',
        roles: ['ADMIN', 'RH', 'LIDER', 'DIRECTOR', 'GESTOR'],
      },
    ],
  },
  {
    label: 'CRM',
    items: [
      {
        href: '/crm/beneficiaries',
        icon: UserCheck,
        label: 'Beneficiários',
        roles: ['ADMIN', 'RH', 'GESTOR'],
      },
      {
        href: '/crm/partners',
        icon: Briefcase,
        label: 'Parceiros',
        roles: ['ADMIN', 'RH', 'GESTOR'],
      },
      {
        href: '/crm/funders',
        icon: DollarSign,
        label: 'Financiadores',
        roles: ['ADMIN', 'RH', 'GESTOR'],
      },
    ],
  },
  {
    label: 'Aprendizagem',
    items: [
      { href: '/courses', icon: BookOpen, label: 'Cursos' },
      { href: '/evaluation', icon: Star, label: 'Avaliações' },
      { href: '/live-classes', icon: Play, label: 'Aulas ao Vivo' },
      { href: '/content-library', icon: Library, label: 'Biblioteca' },
      { href: '/ai-tutor', icon: Bot, label: 'Tutor de IA' },
      { href: '/avatar-training', icon: Presentation, label: 'Avatar Training' },
    ],
  },
  {
    label: 'Recursos Humanos',
    items: [
      {
        // Módulo "Utilizadores" único: integra Utilizadores + Colaboradores
        // (ex-/employees) + Permissões por Cargos (ex-/roles-permissions)
        // como separadores da mesma página. Roles = união dos 3 antigos
        // itens de sidebar. Ver app/(platform)/users/page.tsx.
        href: '/users',
        icon: Users,
        label: 'Utilizadores',
        roles: ['ADMIN', 'RH', 'GESTOR', 'LIDER'],
      },
      { href: '/leave', icon: Calendar, label: 'Férias e Licenças' },
      {
        href: '/departments',
        icon: Building2,
        label: 'Departamentos',
        roles: [
          'ADMIN',
          'RH',
          'GESTOR',
          'LIDER',
          'INSTRUCTOR',
          'DIRECTOR',
          'AUDITOR',
        ],
      },
      { href: '/organization', icon: Network, label: 'Organização' },
      { href: '/leadership', icon: Crown, label: 'Liderança' },
      {
        // Módulo "Competências" único: integra Competências + Mapa de
        // Competências (ex-/competency-map) como separadores da mesma
        // página. Ver app/(platform)/competencies/page.tsx.
        href: '/competencies',
        icon: Award,
        label: 'Competências',
      },
      { href: '/evaluation360', icon: MessageSquare, label: 'Avaliação 360°' },
      { href: '/onboarding', icon: UserPlus, label: 'Onboarding - Integração' },
      {
        // Módulo "Folha de Pagamento" único: integra Recibos Salariais
        // (ex-/payslips) como separadores da mesma página. Ver
        // app/(platform)/payroll/page.tsx.
        href: '/payroll',
        icon: Wallet,
        label: 'Folha de Pagamento',
      },
      { href: '/trainings', icon: GraduationCap, label: 'Gestão de Formações' },
    ],
  },
  {
    label: 'Carreira',
    items: [
      {
        // Módulo "Carreira" único: integra Sucessão (ex-/sucession) como
        // separador da mesma página. Ver app/(platform)/career/page.tsx.
        href: '/career',
        icon: Target,
        label: 'Carreira',
      },
      {
        // Módulo "Planos de Desenvolvimento" único: integra Desenvolvimento
        // de Talentos (ex-/talent-development — pool, skill-gaps, mentoria,
        // análises) como separadores da mesma página.
        href: '/development-plans',
        icon: Activity,
        label: 'Planos de Desenvolvimento',
      },
    ],
  },
  {
    label: 'Compromisso',
    items: [{ href: '/events', icon: Calendar, label: 'Eventos Corporativos' }],
  },
  {
    label: 'Processos',
    items: [
      { href: '/processes', icon: Database, label: 'Processos' },
      {
        href: '/automation',
        icon: Zap,
        label: 'Automações',
        roles: ADMIN_ROLES,
      },
      {
        href: '/api-integrations',
        icon: Globe,
        label: 'Integrações com Sistemas Externos',
        roles: ADMIN_ROLES,
      },
      { href: '/history', icon: Clock, label: 'Histórico' },
      // DIRECTOR entra só para o separador "Apagados" (restaurar ciclos 360º
      // que eliminou) — a página filtra os restantes separadores por papel,
      // ver components/audit/constants.ts NAV[].roles.
      {
        href: '/audit',
        icon: Shield,
        label: 'Auditoria',
        roles: [...ADMIN_ROLES, 'GESTOR', 'AUDITOR', 'DIRECTOR'],
      },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      {
        href: '/roi-impact',
        icon: DollarSign,
        label: 'ROI e Impacto',
        roles: ['ADMIN', 'RH', 'DIRECTOR'],
      },
      {
        href: '/monitoring',
        icon: Activity,
        label: 'Monitorização',
        roles: ['ADMIN', 'AUDITOR', 'RH', 'DIRECTOR', 'GESTOR'],
      },
      {
        href: '/scalability',
        icon: PieChart,
        label: 'Escalabilidade',
        roles: ['ADMIN', 'AUDITOR'],
      },
      {
        href: '/executive-reports',
        icon: Download,
        label: 'Relatório Executivos',
        roles: ADMIN_ROLES,
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/settings', icon: Settings, label: 'Definições' },
    ],
  },
];

const NAVY = '#0F1F3D';

const SECTION_ICONS: Record<string, typeof LayoutDashboard> = {
  Principal: LayoutDashboard,
  CRM: Handshake,
  Aprendizagem: GraduationCap,
  'Recursos Humanos': Users,
  Carreira: Target,
  Compromisso: Calendar,
  Processos: Database,
  Relatórios: FileText,
  Sistema: Settings,
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Sidebar() {
  const pathname = usePathname();
  const role = useCurrentRole();

  // Filtro por role centralizado em lib/roles.ts (fonte única, testada em
  // lib/roles.test.ts) — inclui a regra de "mostra tudo enquanto a role ainda
  // não chegou" para evitar "flash" no arranque após login/reload.
  const visibleNav = filterNavSections(NAV, role);

  // Como na sidebar original: todas as secções abertas por defeito e cada uma
  // recolhível de forma independente. A secção da rota activa fica destacada.
  const activeSection =
  NAV.find((s) => s.items.some((i) => isActive(pathname, i.href)))?.label ??
  null;
const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
  Object.fromEntries(NAV.map((s) => [s.label, s.label !== activeSection])),
);

  // Se a rota activa estiver numa secção recolhida, volta a abri-la.
  useEffect(() => {
    if (activeSection) {
      setCollapsed((c) => (c[activeSection] ? { ...c, [activeSection]: false } : c));
    }
  }, [activeSection]);

  function toggle(label: string) {
    setCollapsed((c) => ({ ...c, [label]: !c[label] }));
  }

  return (
    <aside
      style={{
        width: 240,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        borderRight: '1px solid #e5e7eb',
        boxShadow: '4px 0 24px rgba(15, 31, 61, 0.04)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Image
              src="/images/innova-logo.jpeg"
              alt="INNOVA"
              width={36}
              height={36}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
          <span
            style={{
              color: NAVY,
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: -0.5,
            }}
          >
            INNOVA
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 8px' }}>
        {visibleNav.map((section) => {
          const isOpen = !collapsed[section.label];
          const isCurrent = activeSection === section.label;
          const SectionIcon = SECTION_ICONS[section.label] ?? LayoutDashboard;
          const Chevron = isOpen ? ChevronUp : ChevronDown;

          return (
            <div key={section.label} style={{ marginBottom: 4 }}>
              {/* Cabeçalho do grupo */}
              <button
                onClick={() => toggle(section.label)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: isCurrent ? NAVY : 'transparent',
                  color: isCurrent ? '#ffffff' : NAVY,
                  fontSize: 15,
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <SectionIcon size={18} strokeWidth={1.75} />
                <span style={{ flex: 1 }}>{section.label}</span>
                <Chevron size={16} strokeWidth={2} />
              </button>

              {/* Itens do grupo */}
              {isOpen && (
                <div style={{ padding: '6px 0 4px' }}>
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '9px 14px',
                          margin: '1px 0',
                          borderRadius: 10,
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          color: NAVY,
                          background: active ? '#eef1f6' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <item.icon
                          size={18}
                          color={NAVY}
                          strokeWidth={1.75}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{ lineHeight: 1.3 }}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => logout()}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: NAVY,
            fontSize: 14,
          }}
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sair
        </button>
      </div>
    </aside>
  );
}