"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const Icon = ({ d, d2, d3 }: { d: string; d2?: string; d3?: string }) => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d={d} />
    {d2 && <path d={d2} />}
    {d3 && <path d={d3} />}
  </svg>
);

const navGroups: NavGroup[] = [
  {
    group: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />,
      },
    ],
  },
  {
    group: "Aprendizagem",
    items: [
      {
        label: "Cursos",
        href: "/cursos",
        icon: <Icon d="M12 2L2 7l10 5 10-5-10-5z" d2="M2 17l10 5 10-5" d3="M2 12l10 5 10-5" />,
      },
      {
        label: "Percursos",
        href: "/percursos",
        icon: <Icon d="M9 11l3 3L22 4" d2="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
      },
      {
        label: "Inscrições",
        href: "/inscricoes",
        icon: <Icon d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" d2="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />,
      },
      {
        label: "Avaliações",
        href: "/avaliacoes",
        icon: <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />,
      },
      {
        label: "Biblioteca",
        href: "/biblioteca",
        icon: <Icon d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" d2="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />,
      },
      {
        label: "Certificados",
        href: "/certificados",
        icon: <Icon d="M12 15l-2 5-1-1-5 1 3-4.87" d2="M7.38 9A5 5 0 1 1 16.62 9" d3="M12 15l2 5 1-1 5 1-3-4.87" />,
      },
      {
        label: "Micro-aprendizagem",
        href: "/microlearning",
        icon: <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
      },
      {
        label: "Avatar Training",
        href: "/avatar-training",
        icon: <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" d2="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
      },
      {
        label: "Formações",
        href: "/formacoes",
        icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" d2="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
      },
      {
        label: "Avaliação de Cursos",
        href: "/avaliacao-cursos",
        icon: <Icon d="M11.49 3.17c.43-1.17 2.09-1.17 2.52 0l1.6 4.33a1 1 0 0 0 .95.69h4.56c1.26 0 1.78 1.61.76 2.35l-3.69 2.68a1 1 0 0 0-.36 1.12l1.6 4.33c.43 1.17-.96 2.14-1.95 1.4L12 17.27l-3.48 2.79c-.99.74-2.38-.23-1.95-1.4l1.6-4.33a1 1 0 0 0-.36-1.12L4.12 10.54c-1.02-.74-.5-2.35.76-2.35h4.56a1 1 0 0 0 .95-.69l1.1-3.33z" />,
      },
      {
        label: "Aulas ao Vivo",
        href: "/live",
        icon: <Icon d="M15 10l4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />,
      },
    ],
  },
  {
    group: "Recursos Humanos",
    items: [
      {
        label: "Colaboradores",
        href: "/colaborador",
        icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" d2="M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
      },
      {
        label: "Cargos",
        href: "/cargos",
        icon: <Icon d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" d2="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" />,
      },
      {
        label: "Desempenho",
        href: "/desempenho",
        icon: <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
      },
      {
        label: "Sucessão",
        href: "/sucessao",
        icon: <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
      },
      {
        label: "Onboarding",
        href: "/onboarding",
        icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />,
      },
      {
        label: "Mapa de Competências",
        href: "/competencias",
        icon: <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0v10l6 3" />,
      },
      {
        label: "Desenvolvimento",
        href: "/desenvolvimento",
        icon: <Icon d="M2 20h20M5 20V10l7-7 7 7v10" />,
      },
      {
        label: "Liderança",
        href: "/lideranca",
        icon: <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
      },
      {
        label: "Base de Conhecimento",
        href: "/conhecimento",
        icon: <Icon d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" d2="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
      },
      {
        label: "Processos",
        href: "/processos",
        icon: <Icon d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h10m0 0v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m14 0h2" />,
      },
      {
        label: "Carreira",
        href: "/carreira",
        icon: <Icon d="M13 17l5-5-5-5M6 17l5-5-5-5" />,
      },
      {
        label: "Planos de Carreira",
        href: "/planos-carreira",
        icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" />,
      },
      {
        label: "Histórico",
        href: "/historico",
        icon: <Icon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
      },
    ],
  },
  {
    group: "Inteligência",
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />,
      },
      {
        label: "ROI & Impacto",
        href: "/roi",
        icon: <Icon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
      },
      {
        label: "Relatórios",
        href: "/relatorios",
        icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" />,
      },
      {
        label: "Escalabilidade",
        href: "/escalabilidade",
        icon: <Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
      },
    ],
  },
  {
    group: "Envolvimento",
    items: [
      {
        label: "Gamificação",
        href: "/gamificacao",
        icon: <Icon d="M8 21h8M12 17v4M7 4v3M17 4v3M5 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />,
      },
      {
        label: "Feedback",
        href: "/feedback",
        icon: <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
      },
    ],
  },
  {
    group: "Eventos & IA",
    items: [
      {
        label: "Eventos",
        href: "/eventos",
        icon: <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
      },
      {
        label: "Tutor IA",
        href: "/ai-tutor",
        icon: <Icon d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />,
      },
      {
        label: "Instrutores",
        href: "/instrutores",
        icon: <Icon d="M12 14l9-5-9-5-9 5 9 5z" d2="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z" />,
      },
    ],
  },
  {
    group: "Sistema",
    items: [
      {
        label: "Utilizadores",
        href: "/users",
        icon: <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" d2="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
      },
      {
        label: "Notificações",
        href: "/notificacoes",
        icon: <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" d2="M13.73 21a2 2 0 0 1-3.46 0" />,
      },
      {
        label: "Automações",
        href: "/automacoes",
        icon: <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
      },
      {
        label: "Auditoria",
        href: "/auditoria",
        icon: <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />,
      },
      {
        label: "Integrações",
        href: "/integracoes",
        icon: <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" d2="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
      },
      {
        label: "Relatórios Executivos",
        href: "/executive-pdf",
        icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6" />,
      },
      {
        label: "Definições",
        href: "/settings",
        icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" d2="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <aside style={{
      width: "240px",
      minHeight: "100vh",
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--accent)", borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div>
            <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px" }}>Innova</div>
            <div style={{ color: "var(--text-sidebar)", fontSize: "11px" }}>Academia Digital</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.group];
          return (
            <div key={group.group} style={{ marginBottom: "4px" }}>
              <button
                onClick={() => toggleGroup(group.group)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-sidebar)",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginTop: "8px",
                }}
              >
                {group.group}
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}
                  style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "0.2s" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {!isCollapsed && group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "8px 12px",
                      borderRadius: "7px",
                      marginBottom: "1px",
                      color: isActive ? "var(--text-sidebar-active)" : "var(--text-sidebar)",
                      background: isActive ? "var(--sidebar-active)" : "transparent",
                      textDecoration: "none",
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "13px",
                      transition: "all 0.15s ease",
                      borderLeft: isActive ? "3px solid var(--accent-light)" : "3px solid transparent",
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.65, flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "var(--sidebar-active)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent-light)", fontWeight: 700, fontSize: "13px",
          }}>A</div>
          <div>
            <div style={{ color: "#ffffff", fontSize: "12px", fontWeight: 600 }}>Admin</div>
            <div style={{ color: "var(--text-sidebar)", fontSize: "11px" }}>Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
