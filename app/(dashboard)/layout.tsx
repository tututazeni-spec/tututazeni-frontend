import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
 
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar fixa */}
      <Sidebar />
 
      {/* Conteúdo principal */}
      <div
        style={{
          marginLeft: "240px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "var(--content-bg)",
        }}
      >
        <Topbar title="Innova — Academia Digital" />
 
        <main
          style={{
            flex: 1,
            padding: "28px",
            maxWidth: "1280px",
            width: "100%",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
 