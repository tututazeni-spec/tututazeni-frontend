export default function SettingsPage() {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        padding: "28px",
      }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
        Definições
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        Configurações do sistema em desenvolvimento.
      </p>
    </div>
  );
}
 