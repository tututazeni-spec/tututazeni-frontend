"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Users, ClipboardList, Star, Award,
  TrendingUp, Briefcase, Trophy, BarChart2, FileText, Bell, Shield,
  Bot, GraduationCap, Calendar, UserCheck, GitBranch, Zap, Settings,
  ChevronDown, ChevronRight, BookMarked, Map, Crown, UserPlus,
  Layers, Play, Cpu, Database, Globe, Target, PieChart,
  Clock, MessageSquare, Scroll, Library, DollarSign, Activity,
  Download, CheckSquare, Building2, LogOut, Share2, Brain,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",    icon: LayoutDashboard,  label: "Dashboard"    },
      { href: "/dashboard-rh", icon: Users,            label: "Dashboard RH" },
      { href: "/analytics",    icon: BarChart2,        label: "Indicadores de Desempenho"    },
      { href: "/reports",      icon: FileText,         label: "Relatórios"   },
    ],
  },
  {
    label: "Aprendizagem",
    items: [
      { href: "/courses",          icon: BookOpen,   label: "Cursos"           },
      { href: "/course-modules",   icon: Layers,     label: "Módulos & Lições" },
      { href: "/learning-paths",   icon: GitBranch,  label: "Percursos de Aprendizagem" },
      { href: "/enrollments",      icon: ClipboardList, label: "Matrículas"    },
      { href: "/evaluation",       icon: Star,       label: "Avaliações"       },
      { href: "/micro-learning",   icon: Zap,        label: "Micro-aprendizagem"   },
      { href: "/live-classes",     icon: Play,       label: "Aulas ao Vivo"    },
      { href: "/content-library",  icon: Library,    label: "Biblioteca"       },
      { href: "/knowledge",        icon: BookMarked, label: "Conhecimento"     },
      { href: "/ai-tutor",         icon: Bot,        label: "Tutor de IA"         },
      { href: "/avatar-training",  icon: Cpu,        label: "Treino de Avatar"  },
    ],
  },
  {
    label: "Recursos Humanos",
    items: [
      { href: "/users",             icon: Users,         label: "Utilizadores"     },
      { href: "/employees",         icon: UserCheck,     label: "Colaborador"      },
      { href: "/leave-management",  icon: Calendar,      label: "Férias e Licenças" }, 
      { href: "/departments",       icon: Building2,     label: "Departamentos"    },
      { href: "/roles-permissions", icon: Briefcase,     label: "Permissões por Cargos"           },
      { href: "/performance",       icon: TrendingUp,    label: "Desempenho"       },
      { href: "/competencies",      icon: Award,         label: "Competências"     },
      { href: "/competency-map",    icon: Share2,        label: "Mapa de Competências" }, 
      { href: "/evaluation360",     icon: MessageSquare, label: "Avaliação 360°"    },
      { href: "/onboarding",        icon: UserPlus,      label: "Integração"       },
      { href: "/succession",        icon: GitBranch,     label: "Sucessão"         },
      { href: "/payslips",          icon: FileText,      label: "Recibos Salariais" },
      { href: "/organization",      icon: Share2,        label: "Organograma" },
      { href: "/trainings",         icon: GraduationCap, label: "Formações"        },
    ],
  },
  {
    label: "Carreira",
    items: [
      { href: "/career",            icon: Target,   label: "Carreira"       },
      { href: "/career-plans",      icon: Layers,   label: "Planos de Carreira"},
      { href: "/development-plans", icon: Activity, label: "Planos de Desenvolvimento" },
      { href: "/leader",            icon: Crown,    label: "Liderança"       },
      { href: "/leadership",        icon: BookOpen, label: "Programas de Liderança" },
      { href: "/certificates",      icon: Scroll,   label: "Certificados"    },
      { href: "/talent-development",      icon: Brain, label: "Desenvolvimento de Talentos" },
    ],
  },
  {
    label: "Compromisso",
    items: [
      { href: "/events",           icon: Calendar,      label: "Eventos Corporativos"     },
      { href: "/engagement",       icon: MessageSquare, label: "Participação"  },
      { href: "/instructor",       icon: GraduationCap, label: "Instrutores" },
    ],
  },
  {
    label: "Processos",
    items: [
      { href: "/process-standard", icon: Database, label: "Processos"   },
      { href: "/automation",       icon: Zap,      label: "Automações"  },
      { href: "/api-integration",  icon: Globe,    label: "Integrações com Sistemas Externos" },
      { href: "/history",          icon: Clock,    label: "Histórico"   },
      { href: "/audit",            icon: Shield,   label: "Auditoria"   },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/roi-impact",       icon: DollarSign, label: "ROI e Impacto"  },
      { href: "/scalability",      icon: PieChart,   label: "Escalabilidade" },
      { href: "/executive-reports",    icon: Download,   label: "Relatório Executivos" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/notifications",    icon: Bell,     label: "Notificações" },
      { href: "/settings",         icon: Settings, label: "Definições"   },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(label: string) {
    setCollapsed(c => ({ ...c, [label]: !c[label] }));
  }

  function logout() {
    // Pede ao backend para limpar o cookie httpOnly e redirecciona para /login.
    void fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      window.location.href = "/login";
    });
  }

  return (
    <aside style={{
      width: 240, position: "fixed", top: 0, left: 0, height: "100vh",
      background: "#0f172a", display: "flex", flexDirection: "column",
      overflowY: "auto", zIndex: 100, borderRight: "1px solid #1e293b",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, color: "#fff", fontSize: 16,
          }}>I</div>
          <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
            INNOVA
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {NAV.map(section => (
          <div key={section.label}>
            <button
              onClick={() => toggle(section.label)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "6px 16px",
                background: "none", border: "none", cursor: "pointer",
                color: "#64748b", fontSize: 10, fontWeight: 700,
                letterSpacing: 1, textTransform: "uppercase", marginTop: 8,
              }}
            >
              {section.label}
              {collapsed[section.label]
                ? <ChevronRight size={12} />
                : <ChevronDown  size={12} />}
            </button>

            {!collapsed[section.label] && section.items.map(item => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 16px", margin: "1px 8px", borderRadius: 8,
                    textDecoration: "none", fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#f1f5f9" : "#94a3b8",
                    background: active ? "#1e293b" : "transparent",
                    borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <item.icon size={15} color={active ? "#3b82f6" : "#64748b"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid #1e293b" }}>
        <button
          onClick={logout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "8px 16px", borderRadius: 8, background: "none",
            border: "none", cursor: "pointer", color: "#ef4444", fontSize: 13,
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );
}