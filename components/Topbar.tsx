"use client";
 
import { useRouter } from "next/navigation";
 
interface TopbarProps {
  title: string;
}
 
export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();
 
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };
 
  return (
    <header
      style={{
        height: "60px",
        background: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Título da página */}
      <h1 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
        {title}
      </h1>
 
      {/* Acções */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Notificações */}
        <button
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
 
        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            background: "transparent",
            cursor: "pointer",
            fontSize: "13px",
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair
        </button>
      </div>
    </header>
  );
}