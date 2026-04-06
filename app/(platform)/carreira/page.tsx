"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
 
export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    api.get<any>("/careers?page=1&limit=20")
      .then(res => {
        setData(res?.data ?? res ?? []);
        setTotal(res?.total ?? 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
 
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>Carreira</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Progressão de carreira</p>
      </div>
 
      {loading && <p style={{ color: "#94a3b8" }}>A carregar...</p>}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 16, color: "#ef4444", fontSize: 13 }}>
          {error}
        </div>
      )}
      {!loading && !error && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>{total} registos encontrados</span>
          </div>
          {data.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              Nenhum registo encontrado.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {Object.keys(data[0] || {}).slice(0, 6).map(k => (
                      <th key={k} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                      {Object.values(row).slice(0, 6).map((val: any, j: number) => (
                        <td key={j} style={{ padding: "10px 16px", color: "#1e293b" }}>
                          {typeof val === "object" ? JSON.stringify(val).slice(0, 50) : String(val ?? "—").slice(0, 60)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
