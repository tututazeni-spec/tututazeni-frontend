import "../globals.css";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", margin: 0, padding: 0 }}>
      <Sidebar />
      <div style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar />
        <main style={{ flex: 1, padding: "32px", marginTop: "56px", background: "#f8fafc" }}>
          {children}
        </main>
      </div>
    </div>
  );
}