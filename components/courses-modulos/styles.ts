// components/courses-modulos/styles.ts
// Estilos inline partilhados (esta página usa React.CSSProperties, não
// Tailwind). Extraído de app/(platform)/courses/modulos/page.tsx.

export const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  padding: 24,
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  color: '#1e293b',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: '#64748b',
  marginBottom: 6,
};

export const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  background: '#1e40af',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export const btnGhost: React.CSSProperties = {
  padding: '10px 18px',
  background: '#f1f5f9',
  color: '#475569',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export const btnDanger: React.CSSProperties = {
  padding: '6px 12px',
  background: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
