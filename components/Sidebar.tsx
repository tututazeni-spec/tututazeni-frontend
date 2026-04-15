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
  Download, CheckSquare, Building2, LogOut, Share2,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
      { href: "/dashboard-rh", icon: Users,           label: "Dashboard RH" },
      { href: "/analytics",    icon: BarChart2,        label: "Indicadores de Desempenho"    },
      { href: "/relatorios",   icon: FileText,         label: "Relatórios"   },
    ],
  },
  {
    label: "Aprendizagem",
    items: [
      { href: "/cursos",           icon: BookOpen,   label: "Cursos"           },
      { href: "/cursos/modulos",   icon: Layers,     label: "Módulos & Lições" },
      { href: "/learning-paths",   icon: GitBranch,  label: "Percursos de Aprendizagem" },
      { href: "/percursos",        icon: Map,        label: "Percursos"        },
      { href: "/inscricoes",       icon: ClipboardList, label: "Inscrições"    },
      { href: "/avaliacoes",       icon: Star,       label: "Avaliações"       },
      { href: "/avaliacao-cursos", icon: CheckSquare,label: "Aval. Cursos"     },
      { href: "/microlearning",    icon: Zap,        label: "Microaprendizagem"   },
      { href: "/live",             icon: Play,       label: "Aulas ao Vivo"    },
      { href: "/biblioteca",       icon: Library,    label: "Biblioteca"       },
      { href: "/conhecimento",     icon: BookMarked, label: "Conhecimento"     },
      { href: "/ai-tutor",         icon: Bot,        label: "Tutor de IA"         },
      { href: "/avatar-training",  icon: Cpu,        label: "Treino de Avatar"  },
    ],
  },
  {
    label: "Recursos Humanos",
    items: [
      { href: "/users",             icon: Users,         label: "Utilizadores"     },
      { href: "/colaborador",       icon: UserCheck,     label: "Colaborador"      },
      { href: "/ferias",            icon: Calendar,      label: "Férias & Licenças" }, 
      { href: "/departments",       icon: Building2,     label: "Departamentos"    },
      { href: "/cargos",            icon: Briefcase,     label: "Cargos"           },
      { href: "/desempenho",        icon: TrendingUp,    label: "Desempenho"       },
      { href: "/competencias",      icon: Award,         label: "Competências"     },
      { href: "/mapa-competencias", icon: Share2,        label: "Mapa Competências" }, // ← Share2 (era Network)
      { href: "/feedback",          icon: MessageSquare, label: "Feedback 360°"    },
      { href: "/onboarding",        icon: UserPlus,      label: "Integração"       },
      { href: "/sucessao",          icon: GitBranch,     label: "Sucessão"         },
      { href: "/payslips",           icon: FileText,      label: "Recibos Salariais"          },
      { href: "/organization",      icon: Share2,        label: "Organograma" },
      { href: "/formacoes",         icon: GraduationCap, label: "Formações"        },
    ],
  },
  {
    label: "Carreira",
    items: [
      { href: "/carreira",        icon: Target,   label: "Carreira"       },
      { href: "/planos-carreira", icon: Layers,   label: "Planos Carreira"},
      { href: "/desenvolvimento", icon: Activity, label: "Planos de Desenvolvimento" },
      { href: "/lideranca",       icon: Crown,    label: "Liderança"       },
      { href: "/leadership",      icon: BookOpen, label: "Programas Liderança" },
      { href: "/certificados",    icon: Scroll,   label: "Certificados"    },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/gamificacao", icon: Trophy,        label: "Gamificação" },
      { href: "/eventos",     icon: Calendar,      label: "Eventos"     },
      { href: "/engagement",  icon: MessageSquare, label: "Participação"  },
      { href: "/instrutores", icon: GraduationCap, label: "Instrutores" },
    ],
  },
  {
    label: "Processos",
    items: [
      { href: "/processos",   icon: Database, label: "Processos"   },
      { href: "/automacoes",  icon: Zap,      label: "Automações"  },
      { href: "/integracoes", icon: Globe,    label: "Integrações" },
      { href: "/historico",   icon: Clock,    label: "Histórico"   },
      { href: "/auditoria",   icon: Shield,   label: "Auditoria"   },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/roi",           icon: DollarSign, label: "ROI & Impacto"  },
      { href: "/escalabilidade",icon: PieChart,   label: "Escalabilidade" },
      { href: "/executive-pdf", icon: Download,   label: "Relatório Exec." }, // ← Download (era FileOutput)
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/notificacoes", icon: Bell,     label: "Notificações" },
      { href: "/settings",     icon: Settings, label: "Definições"   },
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
    localStorage.removeItem("token");
    window.location.href = "/login";
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