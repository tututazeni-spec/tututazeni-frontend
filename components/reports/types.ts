// components/reports/types.ts
// Tipos do domínio de relatórios: templates, dados genéricos de
// relatório e insights IA. Extraído de app/(platform)/reports/page.tsx.

// Nem todos os valores de Tab têm entrada em TABS/são renderizados
// actualmente (só 'hub' e 'insights' estão activos) — mantido por
// corresponder às categorias reais de relatório da API.
export type Tab =
  | 'hub'
  | 'hr'
  | 'learning'
  | 'performance'
  | 'talent'
  | 'engagement'
  | 'compliance'
  | 'insights'
  | 'saved';

// Relatório personalizado guardado pelo utilizador (POST/GET /reports/saved).
// Espelha o modelo SavedReport do Prisma; `params` é um JSON string dos
// filtros guardados (ex: '{"from":"2026-01-01","to":"2026-01-31"}').
export interface SavedReport {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  reportKey: string;
  params: string;
  isTemplate: boolean;
  favourite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  reportKey: string;
  description: string;
}

export interface ReportDeptEntry {
  department?: string;
  name?: string;
  count?: number;
  avgScore?: number;
  completions?: number;
}

export interface ReportTopItem {
  user?: { fullName: string; department?: { name: string } | null };
  course?: { title: string; category?: string };
  competency?: { name: string; type?: string };
  content?: { title: string };
  name?: string;
  score?: number;
  avgScore?: number;
  completionRate?: number;
  views?: number;
  avgGap?: number;
}

export interface ReportData {
  summary?: Record<
    string,
    string | number | boolean | null | Record<string, unknown>
  >;
  insights?: string[];
  byDepartment?: ReportDeptEntry[];
  topPerformers?: ReportTopItem[];
  topCourses?: ReportTopItem[];
  skills?: ReportTopItem[];
  topContent?: ReportTopItem[];
}

export interface InsightItem {
  severity: string;
  type: string;
  message: string;
  recommendation?: string;
}

export interface InsightsData {
  count: number;
  insights: InsightItem[];
}

export interface ReportRange {
  from: string;
  to: string;
  deptId: string;
}
