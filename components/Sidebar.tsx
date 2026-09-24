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
  GraduationCap,
  Calendar,
  UserCheck,
  Zap,
  Settings,
  ChevronDown,
  ChevronRight,
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
  Share2,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

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
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
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
      {
        // Módulo "Competências" único: integra Competências + Mapa de
        // Competências (ex-/competency-map) como separadores da mesma
        // página. Ver app/(platform)/competencies/page.tsx.
        href: '/competencies',
        icon: Award,
        label: 'Competências',
      },
      { href: '/evaluation360', icon: MessageSquare, label: 'Avaliação 360°' },
      { href: '/onboarding', icon: UserPlus, label: 'Integração' },
      { href: '/payslips', icon: FileText, label: 'Recibos Salariais' },
      {
        href: '/payroll',
        icon: Wallet,
        label: 'Folha de Pagamento',
        roles: ADMIN_ROLES,
      },
      { href: '/organization', icon: Share2, label: 'Organograma' },
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
        roles: [...ADMIN_ROLES, 'DIRECTOR'],
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

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const role = useCurrentRole();

  // Filtro por role centralizado em lib/roles.ts (fonte única, testada em
  // lib/roles.test.ts) — inclui a regra de "mostra tudo enquanto a role ainda
  // não chegou" para evitar "flash" no arranque após login/reload.
  const visibleNav = filterNavSections(NAV, role);

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
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 100,
        borderRight: '1px solid #1e293b',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
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
              src="/images/innova-logo.png"
              alt="INNOVA"
              width={36}
              height={36}
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
          <span
            style={{
              color: '#f1f5f9',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: -0.5,
            }}
          >
            INNOVA
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {visibleNav.map((section) => (
          <div key={section.label}>
            <button
              onClick={() => toggle(section.label)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginTop: 8,
              }}
            >
              {section.label}
              {collapsed[section.label] ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>

            {!collapsed[section.label] &&
              section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 16px',
                      margin: '1px 8px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#f1f5f9' : '#94a3b8',
                      background: active ? '#1e293b' : 'transparent',
                      borderLeft: active
                        ? '3px solid #3b82f6'
                        : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <item.icon
                      size={15}
                      color={active ? '#3b82f6' : '#64748b'}
                    />
                    {item.label}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#ef4444',
            fontSize: 13,
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );
}
