"use client";
import { Bell, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
 
export default function Topbar() {
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);
 
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);
 
  return (
    <header style={{
      position: "fixed", top: 0, left: 240, right: 0, height: 56,
      background: "#ffffff", borderBottom: "1px solid #e2e8f0",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", zIndex: 90,
    }}>
      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", width: 280 }}>
        <Search size={14} color="#94a3b8" />
        <input
          placeholder="Pesquisar..."
          style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#1e293b", width: "100%" }}
        />
      </div>
 
      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer" }}>
          <Bell size={18} color="#64748b" />
          <span style={{
            position: "absolute", top: -4, right: -4, width: 8, height: 8,
            borderRadius: "50%", background: "#ef4444",
          }} />
        </button>
 
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>
              {user?.fullName ?? "Utilizador"}
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              {user?.email ?? ""}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
 
