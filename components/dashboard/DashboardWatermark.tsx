// src/components/dashboard/DashboardWatermark.tsx
//
// Ícone de grelha usado como marca de água atrás da palavra "Dashboard".
// Herda a cor via `currentColor` (controlar com text-white/15, etc.).

export function DashboardWatermark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      aria-hidden="true"
      className={className}
    >
      <rect x="18" y="16" width="30" height="34" rx="7" />
      <rect x="56" y="22" width="28" height="22" rx="7" />
      <rect x="18" y="58" width="30" height="24" rx="7" />
      <rect x="56" y="52" width="28" height="30" rx="7" />
    </svg>
  );
}