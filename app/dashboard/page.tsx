"use client";
 
import { useUsers } from "../../hooks/useUsers";
 
export default function DashboardPage() {
  const { users, loading, error } = useUsers();
 
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "Utilizadores", value: users.length, color: "#2563eb", icon: "👥" },
          { label: "Cursos Activos", value: "—", color: "#10b981", icon: "📚" },
          { label: "Inscrições", value: "—", color: "#f59e0b", icon: "📋" },
          { label: "Concluídos", value: "—", color: "#8b5cf6", icon: "✅" },
        ].map((card) => (
          <div key={card.label} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</span>
              <span style={{ fontSize: "20px" }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: card.color }}>
              {loading ? "..." : card.value}
            </div>
          </div>
        ))}
      </div>
 
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 600 }}>Utilizadores Recentes</h2>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{users.length} registos</span>
        </div>
 
        {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>A carregar...</div>}
        {error && <div style={{ padding: "40px", textAlign: "center", color: "var(--danger)" }}>{error}</div>}
 
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Nome", "Email", "Estado"].map((h) => (
                  <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderTop: "1px solid var(--card-border)", background: i % 2 === 0 ? "transparent" : "#fafbfc" }}>
                  <td style={{ padding: "14px 24px", fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1e3a5f", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px" }}>
                        {user.fullName?.charAt(0).toUpperCase()}
                      </div>
                      {user.fullName}
                    </div>
                  </td>
                  <td style={{ padding: "14px 24px", color: "var(--text-secondary)" }}>{user.email}</td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "#dcfce7", color: "#166534" }}>Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}