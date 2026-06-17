import "./globals.css";
import type { Metadata } from "next";
import ClientInit from "../components/ClientInit";
import ReactQueryProvider from "../providers/ReactQueryProvider";

export const metadata: Metadata = {
  title: {
    template: "%s | INNOVA",
    default: "INNOVA",
  },
  // Plataforma interna: nunca indexar em motores de busca.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body style={{ margin: 0, padding: 0 }}>
        <ClientInit />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}