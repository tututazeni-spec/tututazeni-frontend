// components/live-classes/Spinner.tsx
// Spinner de carregamento partilhado. Migrado para design tokens.

export function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-13">
      <div
        className="w-7 h-7 rounded-full border-3 border-border"
        style={{ borderTopColor: 'var(--color-danger)' }}
      />
      <p className="m-0 text-sm text-ink-faint">A carregar...</p>
    </div>
  );
}
