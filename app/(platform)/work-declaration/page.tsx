"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Shield,
  QrCode,
  ChevronDown,
  MoreHorizontal,
  ArrowUpRight,
  Stamp,
  BookOpen,
  Users,
  TrendingUp,
  Loader2,
  X,
  Check,
  Building2,
  FileSignature,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeclarationStatus = "draft" | "issued" | "signed" | "expired" | "revoked";
type DeclarationType =
  | "employment"
  | "training"
  | "attendance"
  | "performance"
  | "custom";

interface Declaration {
  id: string;
  code: string;
  title: string;
  type: DeclarationType;
  status: DeclarationStatus;
  employeeName: string;
  employeeRole: string;
  department: string;
  createdAt: string;
  issuedAt?: string;
  expiresAt?: string;
  createdBy: string;
}

interface Stats {
  total: number;
  draft: number;
  issued: number;
  signed: number;
  expiredOrRevoked: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  DeclarationStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Rascunho",
    color: "text-slate-400",
    bg: "bg-slate-800/60",
    icon: <Clock size={12} />,
  },
  issued: {
    label: "Emitida",
    color: "text-sky-400",
    bg: "bg-sky-900/40",
    icon: <ArrowUpRight size={12} />,
  },
  signed: {
    label: "Assinada",
    color: "text-emerald-400",
    bg: "bg-emerald-900/40",
    icon: <CheckCircle size={12} />,
  },
  expired: {
    label: "Expirada",
    color: "text-amber-400",
    bg: "bg-amber-900/40",
    icon: <AlertTriangle size={12} />,
  },
  revoked: {
    label: "Revogada",
    color: "text-red-400",
    bg: "bg-red-900/40",
    icon: <XCircle size={12} />,
  },
};

const TYPE_LABELS: Record<DeclarationType, string> = {
  employment: "Vínculo Empregatício",
  training: "Formação / Treino",
  attendance: "Frequência",
  performance: "Desempenho",
  custom: "Personalizada",
};

// ─── Mocked data ─────────────────────────────────────────────────────────────

const MOCK_DECLARATIONS: Declaration[] = [
  {
    id: "1",
    code: "INNOVA-2025-0041",
    title: "Declaração de Vínculo Empregatício",
    type: "employment",
    status: "signed",
    employeeName: "Ana Ferreira",
    employeeRole: "Product Designer",
    department: "Design",
    createdAt: "2025-04-12",
    issuedAt: "2025-04-13",
    expiresAt: "2025-07-13",
    createdBy: "Maria Silva (RH)",
  },
  {
    id: "2",
    code: "INNOVA-2025-0042",
    title: "Declaração de Participação em Formação",
    type: "training",
    status: "issued",
    employeeName: "Bruno Costa",
    employeeRole: "Engenheiro de Software",
    department: "Tecnologia",
    createdAt: "2025-04-15",
    issuedAt: "2025-04-16",
    createdBy: "Maria Silva (RH)",
  },
  {
    id: "3",
    code: "INNOVA-2025-0043",
    title: "Declaração para Fins Bancários",
    type: "employment",
    status: "draft",
    employeeName: "Carla Mendes",
    employeeRole: "Analista Financeira",
    department: "Finanças",
    createdAt: "2025-04-22",
    createdBy: "João Pinto (RH)",
  },
  {
    id: "4",
    code: "INNOVA-2025-0039",
    title: "Declaração de Frequência",
    type: "attendance",
    status: "expired",
    employeeName: "Diogo Alves",
    employeeRole: "Sales Manager",
    department: "Comercial",
    createdAt: "2025-01-10",
    issuedAt: "2025-01-11",
    expiresAt: "2025-04-11",
    createdBy: "Maria Silva (RH)",
  },
  {
    id: "5",
    code: "INNOVA-2025-0044",
    title: "Declaração de Desempenho",
    type: "performance",
    status: "signed",
    employeeName: "Elena Rocha",
    employeeRole: "Tech Lead",
    department: "Tecnologia",
    createdAt: "2025-04-18",
    issuedAt: "2025-04-19",
    expiresAt: "2025-07-19",
    createdBy: "João Pinto (RH)",
  },
];

const MOCK_STATS: Stats = {
  total: 44,
  draft: 6,
  issued: 12,
  signed: 22,
  expiredOrRevoked: 4,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DeclarationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111827] border border-white/5 p-5 flex flex-col gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
      {/* subtle glow */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 ${accent}`}
      />
    </div>
  );
}

function DeclarationRow({
  dec,
  onAction,
}: {
  dec: Declaration;
  onAction: (action: string, id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      {/* Code + Title */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-slate-500">{dec.code}</span>
          <span className="text-sm font-medium text-white leading-snug">
            {dec.title}
          </span>
          <span className="text-xs text-slate-500">{TYPE_LABELS[dec.type]}</span>
        </div>
      </td>

      {/* Employee */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-white">{dec.employeeName}</span>
          <span className="text-xs text-slate-500">
            {dec.employeeRole} · {dec.department}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusBadge status={dec.status} />
      </td>

      {/* Dates */}
      <td className="px-5 py-4 text-xs text-slate-400">
        <div className="flex flex-col gap-1">
          <span>Criada: {dec.createdAt}</span>
          {dec.issuedAt && <span>Emitida: {dec.issuedAt}</span>}
          {dec.expiresAt && (
            <span
              className={
                dec.status === "expired" ? "text-amber-400" : "text-slate-500"
              }
            >
              Expira: {dec.expiresAt}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAction("view", dec.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Ver detalhes"
          >
            <Eye size={14} />
          </button>
          {(dec.status === "issued" || dec.status === "signed") && (
            <button
              onClick={() => onAction("pdf", dec.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-900/30 transition-colors"
              title="Exportar PDF"
            >
              <Download size={14} />
            </button>
          )}
          {dec.status === "draft" && (
            <button
              onClick={() => onAction("issue", dec.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30 transition-colors"
              title="Emitir"
            >
              <ArrowUpRight size={14} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-[#1a2235] border border-white/10 shadow-xl py-1">
                <button
                  onClick={() => { onAction("send-email", dec.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <Send size={13} /> Enviar por email
                </button>
                <button
                  onClick={() => { onAction("qr", dec.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <QrCode size={13} /> Ver QR Code
                </button>
                {dec.status === "issued" && (
                  <button
                    onClick={() => { onAction("sign", dec.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-900/20"
                  >
                    <FileSignature size={13} /> Assinar
                  </button>
                )}
                {(dec.status === "issued" || dec.status === "signed") && (
                  <button
                    onClick={() => { onAction("revoke", dec.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20"
                  >
                    <XCircle size={13} /> Revogar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "" as DeclarationType | "",
    templateId: "",
    employeeId: "",
    language: "PT",
    purpose: "",
  });

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white">
              Nova Declaração
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Passo {step} de 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Selecione o tipo de declaração
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["employment", "Vínculo Empregatício", Building2],
                    ["training", "Formação / Treino", BookOpen],
                    ["attendance", "Frequência", Users],
                    ["performance", "Desempenho", TrendingUp],
                    ["custom", "Personalizada", FileText],
                  ] as const
                ).map(([val, label, Icon]) => (
                  <button
                    key={val}
                    onClick={() => setForm({ ...form, type: val })}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left ${
                      form.type === val
                        ? "border-sky-500 bg-sky-900/20 text-sky-300"
                        : "border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Dados do colaborador e template
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">
                    Colaborador
                  </label>
                  <input
                    type="text"
                    placeholder="Pesquisar colaborador..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">
                    Template
                  </label>
                  <select className="w-full bg-[#0f1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50">
                    <option value="">Selecionar template...</option>
                    <option>Template Padrão — Vínculo</option>
                    <option>Template Formal — Jurídico</option>
                    <option>Template Bancário</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">
                    Idioma
                  </label>
                  <div className="flex gap-2">
                    {["PT", "EN", "FR"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setForm({ ...form, language: lang })}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                          form.language === lang
                            ? "border-sky-500 bg-sky-900/20 text-sky-300"
                            : "border-white/8 text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Revisão e confirmação
              </p>
              <div className="rounded-xl bg-white/[0.03] border border-white/8 divide-y divide-white/8">
                {[
                  ["Tipo", TYPE_LABELS[form.type as DeclarationType] || "—"],
                  ["Idioma", form.language],
                  ["Template", "Template Padrão — Vínculo"],
                  ["Status inicial", "Rascunho"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <button
            onClick={() => step > 1 && setStep((s) => (s - 1) as 1 | 2 | 3)}
            className={`px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors ${
              step === 1 ? "invisible" : ""
            }`}
          >
            Anterior
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && !form.type}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white transition-all disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {loading ? "A criar..." : "Criar Declaração"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkDeclarationsPage() {
  const [declarations, setDeclarations] =
    useState<Declaration[]>(MOCK_DECLARATIONS);
  const [stats] = useState<Stats>(MOCK_STATS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeclarationStatus | "all">(
    "all"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    },
    []
  );

  const handleAction = useCallback(
    (action: string, id: string) => {
      const messages: Record<string, string> = {
        pdf: "PDF gerado com sucesso.",
        issue: "Declaração emitida com sucesso.",
        sign: "Declaração assinada.",
        revoke: "Declaração revogada.",
        "send-email": "Email enviado ao colaborador.",
        qr: "QR Code aberto.",
        view: "A abrir detalhes...",
      };
      if (action === "issue") {
        setDeclarations((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "issued" } : d))
        );
      }
      showToast(messages[action] ?? "Ação executada.");
    },
    [showToast]
  );

  const filtered = declarations.filter((d) => {
    const matchSearch =
      d.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#070d18] text-white">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-500/20 flex items-center justify-center">
                <Stamp size={14} className="text-sky-400" />
              </div>
              <span className="text-xs font-medium text-sky-400 uppercase tracking-widest">
                INNOVA · RH
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Declarações de Trabalho
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Emita, gerencie e valide declarações formais de colaboradores
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white transition-colors shadow-lg shadow-sky-900/30"
          >
            <Plus size={15} />
            Nova Declaração
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<FileText size={18} className="text-slate-400" />}
            accent="bg-slate-700"
          />
          <StatCard
            label="Assinadas"
            value={stats.signed}
            icon={<CheckCircle size={18} className="text-emerald-400" />}
            accent="bg-emerald-800"
          />
          <StatCard
            label="Emitidas"
            value={stats.issued}
            icon={<ArrowUpRight size={18} className="text-sky-400" />}
            accent="bg-sky-800"
          />
          <StatCard
            label="Rascunhos"
            value={stats.draft}
            icon={<Clock size={18} className="text-amber-400" />}
            accent="bg-amber-800"
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Pesquisar por colaborador, título ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111827] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            {(
              [
                ["all", "Todas"],
                ["draft", "Rascunho"],
                ["issued", "Emitida"],
                ["signed", "Assinada"],
                ["expired", "Expirada"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === val
                    ? "bg-sky-900/40 text-sky-300 border border-sky-500/30"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl bg-[#0b1121] border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <span className="text-sm text-slate-400">
              {filtered.length} declaração{filtered.length !== 1 ? "ões" : ""}
            </span>
            <button
              onClick={() => setIsLoading(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              title="Atualizar"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">
                    Declaração
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    Colaborador
                  </th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Datas</th>
                  <th className="px-5 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-slate-600"
                    >
                      <FileText
                        size={32}
                        className="mx-auto mb-3 opacity-30"
                      />
                      <p className="text-sm">Nenhuma declaração encontrada</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((dec) => (
                    <DeclarationRow
                      key={dec.id}
                      dec={dec}
                      onAction={handleAction}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination hint */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Mostrando {filtered.length} de {stats.total}
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Anterior
              </button>
              <button className="px-3 py-1.5 text-xs text-white bg-sky-900/40 rounded-lg border border-sky-500/20">
                1
              </button>
              <button className="px-3 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Próxima
              </button>
            </div>
          </div>
        </div>

        {/* ── Verification CTA ── */}
        <div className="rounded-2xl border border-sky-500/10 bg-sky-950/20 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-900/40 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Verificação de Autenticidade
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualquer declaração pode ser verificada publicamente via QR Code
              ou pelo código único.
            </p>
          </div>
          <a
            href="/verify"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-sm font-medium transition-colors border border-sky-500/20"
          >
            <QrCode size={14} />
            Verificar
          </a>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <CreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-900/80 border border-emerald-500/30 text-emerald-200"
              : "bg-red-900/80 border border-red-500/30 text-red-200"
          } backdrop-blur-md`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}