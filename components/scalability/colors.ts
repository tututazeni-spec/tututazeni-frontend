// components/scalability/colors.ts
// Constantes de cores para o dashboard de escalabilidade
// Tema escuro (#080d19) — incompatível com a fundação light-theme,
// documentado como exceção de data-viz/monitorização

// Status de integração
export const STATUS_COLORS = {
  ACTIVE: '#22c55e', // verde (sucesso)
  INACTIVE: '#6b7280', // cinzento (inactivo)
  ERROR: '#ef4444', // vermelho (erro)
  PENDING_AUTH: '#f59e0b', // laranja (aguarda)
} as const;

// Severidade de alerta
export const SEVERITY_COLORS = {
  CRITICAL: {
    bg: '#ef444422',
    color: '#ef4444',
    label: 'Crítico',
  },
  WARNING: {
    bg: '#f59e0b22',
    color: '#f59e0b',
    label: 'Aviso',
  },
  INFO: {
    bg: '#3b82f622',
    color: '#60a5fa',
    label: 'Info',
  },
} as const;

// Cores de métrica (por tipo)
export const METRIC_ACCENT_COLORS = {
  users: '#6366f1', // indigo (utilizadores)
  uptime: '#22c55e', // verde (uptime)
  latency: '#3b82f6', // azul (latência)
  sessions: '#8b5cf6', // roxo (sessões)
  storage: '#0ea5e9', // ciano (armazenamento)
  errorRate: '#f59e0b', // laranja (taxa erro)
  cpu: '#8b5cf6', // roxo (CPU)
  memory: '#6366f1', // indigo (memória)
  requests: '#3b82f6', // azul (requisições)
  activeToggle: '#4ade80', // lima-verde brilhante (toggle ON)
} as const;

// Tema escuro (superfícies)
export const DARK_THEME = {
  bgPrimary: '#080d19', // fundo principal (muito escuro)
  bgSecondary: '#0c1426', // fundo secundário
  bgCard: '#111827', // fundo de cartão
  bgTertiary: '#1a1a2e', // fundo terciário (estado desactivo)
  bgAccentDark: '#1e1b4b', // fundo com acento (indigo escuro)
  bgSuccess: '#14532d', // fundo sucesso (verde escuro)
  bgCritical: '#450a0a', // fundo crítico (vermelho muito escuro)
  bgWarningDark: '#7c2d12', // fundo aviso escuro (orange-900)
  bgGradientUnfilled: '#1e2537', // fundo para conic-gradient (muito escuro)

  borderPrimary: '#1e2a3a', // borda primária
  borderAccent: '#312e81', // borda com acento (indigo)
  borderInfo: '#1e3a5f', // borda info (azul escuro)
  borderCritical: '#ef4444', // borda crítico (vermelho)
  borderCriticalAlpha: '#ef444433', // borda crítico semi-transparente
  borderWarning: '#f59e0b22', // borda aviso semi-transparente
  borderError: '#ef444433', // borda erro semi-transparente
  borderErrorAlpha: '#ef444433', // alias para borderError (compatibilidade)
  borderInactive: '#1f2937', // borda inactiva (cinzento escuro)

  textPrimary: '#f1f5f9', // texto primário (branco/claro)
  textSecondary: '#e2e8f0', // texto secundário
  textTertiary: '#94a3b8', // texto terciário (cinzento claro)
  textMuted: '#64748b', // texto mutado (cinzento médio)
  textFaint: '#475569', // texto tenue (cinzento escuro)
  textSubtle: '#6b7280', // texto subtil (cinzento)
  textDisabled: '#374151', // texto desactivado (cinzento escuro)
  textHighlight: '#a5b4fc', // texto destaque (indigo-300)
  textWarningLight: '#fdba74', // texto aviso claro (orange-300)
  textWhite: '#fff', // texto branco puro (logo/contrast máximo)

  scrollbarBg: '#111827', // fundo scrollbar
  scrollbarThumb: '#1e2a3a', // thumb scrollbar

  bgGradientCard: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // indigo degradé
  bgGradientTablet: 'linear-gradient(135deg, #4f46e5, #7c3aed)', // indigo gradiente (primária)
} as const;

// Cores de estado de conformidade/SLA
export const SLA_STATE_COLORS = {
  breached: {
    bg: '#1a0505', // fundo vermelho muito escuro
    border: '#7f1d1d', // borda vermelho escuro
    gradient: 'linear-gradient(135deg, #1a0505 0%, #2d0909 100%)',
    statusColor: '#ef4444', // vermelho (violado)
    statusText: '#fca5a5', // vermelho claro
  },
  compliant: {
    bg: '#0a1628', // fundo azul muito escuro
    border: '#1e3a5f', // borda azul escuro
    gradient: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 100%)',
    statusColor: '#22c55e', // verde (cumprido)
    statusText: '#86efac', // verde claro
  },
} as const;

// Cores de role/perfil de acesso
export const ROLE_COLORS = {
  admin: '#ef4444', // vermelho
  rh: '#f59e0b', // laranja
  manager: '#8b5cf6', // roxo
  instructor: '#3b82f6', // azul
  employee: '#22c55e', // verde
  auditor: '#6b7280', // cinzento
} as const;
