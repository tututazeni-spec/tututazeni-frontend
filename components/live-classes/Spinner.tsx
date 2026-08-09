// components/live-classes/Spinner.tsx
// Spinner de carregamento partilhado. Extraído de
// app/(platform)/live-classes/page.tsx.

export function Spinner() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '52px 0',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '3px solid #e2e8f0',
          borderTopColor: '#dc2626',
          borderRadius: '50%',
          animation: 'lv-spin 0.7s linear infinite',
        }}
      />
      <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>A carregar...</p>
    </div>
  );
}
