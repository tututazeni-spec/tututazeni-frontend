"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditUser {
  id: number;
  fullName: string;
  email: string;
}

interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  user: AuditUser;
  action: string;
  entity: string;
  entityId: number;
  details?: string;
}

interface PaginatedResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface HistoryFilters {
  userId?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = ["", "CREATE", "UPDATE", "DELETE", "LOGIN"];

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN:  "bg-purple-100 text-purple-800",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchHistory(
  filters: HistoryFilters,
  token: string
): Promise<PaginatedResponse> {
  const params = new URLSearchParams();
  if (filters.userId)  params.set("userId",  filters.userId);
  if (filters.entity)  params.set("entity",  filters.entity);
  if (filters.action)  params.set("action",  filters.action);
  if (filters.from)    params.set("from",    filters.from);
  if (filters.to)      params.set("to",      filters.to);
  params.set("page",  String(filters.page));
  params.set("limit", String(filters.limit));

  const res = await fetch(`/api/history?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erro ao carregar histórico");
  return res.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [data, setData]         = useState<AuditLog[]>([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [filters, setFilters] = useState<HistoryFilters>({
    page: 1,
    limit: 15,
  });

  // form state (applied only on submit / select change)
  const [form, setForm] = useState({
    userId: "",
    entity: "",
    action: "",
    from: "",
    to: "",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // replace with real token retrieval (e.g. from context/store)
      const token = localStorage.getItem("access_token") ?? "";
      const res = await fetchHistory(filters, token);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function applyFilters() {
    setFilters((prev) => ({ ...prev, ...form, page: 1 }));
  }

  function clearFilters() {
    const empty = { userId: "", entity: "", action: "", from: "", to: "" };
    setForm(empty);
    setFilters({ page: 1, limit: 15 });
  }

  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setFilters((prev) => ({ ...prev, page: p }));
  }

  function handleActionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, action: value }));
    setFilters((prev) => ({ ...prev, action: value, page: 1 }));
  }

  function exportCsv() {
    const header = "ID,Data/Hora,Utilizador,Acção,Entidade,ID Entidade\n";
    const rows = data
      .map(
        (r) =>
          `${r.id},"${formatDate(r.timestamp)}","${r.user.fullName}",${r.action},${r.entity},${r.entityId}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "historico.csv";
    a.click();
  }

  // ── Pagination helpers ─────────────────────────────────────────────────────
  const MAX_BTNS = 5;
  let pStart = Math.max(1, filters.page - Math.floor(MAX_BTNS / 2));
  let pEnd   = Math.min(totalPages, pStart + MAX_BTNS - 1);
  if (pEnd - pStart < MAX_BTNS - 1) pStart = Math.max(1, pEnd - MAX_BTNS + 1);
  const pageNumbers: number[] = [];
  for (let i = pStart; i <= pEnd; i++) pageNumbers.push(i);

  const startRow = (filters.page - 1) * filters.limit + 1;
  const endRow   = Math.min(filters.page * filters.limit, total);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Histórico de actividades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registo de todas as acções realizadas no sistema
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Exportar CSV
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total de registos", value: total.toLocaleString("pt-PT") },
          { label: "Páginas",           value: totalPages },
          { label: "Página actual",     value: filters.page },
          { label: "Por página",        value: filters.limit },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-2xl font-medium text-gray-900">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Utilizador
            </label>
            <input
              type="text"
              placeholder="ID ou nome..."
              value={form.userId}
              onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Entidade
            </label>
            <input
              type="text"
              placeholder="Ex: Employee..."
              value={form.entity}
              onChange={(e) => setForm((p) => ({ ...p, entity: e.target.value }))}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Acção
            </label>
            <select
              value={form.action}
              onChange={handleActionChange}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a || "Todas"}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              De
            </label>
            <input
              type="date"
              value={form.from}
              onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Até
            </label>
            <input
              type="date"
              value={form.to}
              onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Filtrar
          </button>
          <button
            onClick={clearFilters}
            className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-900">Registos de auditoria</span>
          <span className="text-sm text-gray-500">{total} registo{total !== 1 ? "s" : ""}</span>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-36">Data/Hora</th>
                <th className="px-4 py-3 text-left font-medium">Utilizador</th>
                <th className="px-4 py-3 text-left font-medium w-28">Acção</th>
                <th className="px-4 py-3 text-left font-medium w-32">Entidade</th>
                <th className="px-4 py-3 text-left font-medium w-24">ID</th>
                <th className="px-4 py-3 text-left font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    A carregar...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Nenhum registo encontrado.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(row.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 shrink-0">
                          {initials(row.user.fullName)}
                        </div>
                        <span className="truncate max-w-[160px]">{row.user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                          ACTION_BADGE[row.action] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.entity}</td>
                    <td className="px-4 py-3 text-gray-400">#{row.entityId}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[200px]">
                      {row.details ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {total > 0 ? `${startRow}–${endRow} de ${total}` : "0 resultados"}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => goPage(filters.page - 1)}
              disabled={filters.page === 1}
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
            >
              ‹
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`text-sm px-3 py-1 rounded-lg border transition ${
                  p === filters.page
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goPage(filters.page + 1)}
              disabled={filters.page === totalPages}
              className="text-sm px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

