import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import ClientInit from "../components/ClientInit";
import ReactQueryProvider from "../providers/ReactQueryProvider";
import { ConfirmProvider } from "../providers/ConfirmProvider";
import { TooltipProvider } from "../components/ui/Tooltip";
import { ToastProvider } from "../providers/ToastProvider";
import SplashScreen from "../components/SplashScreen";

// Fontes self-hosted (subset latin) em vez de next/font/google. O fetch a
// fonts.googleapis.com/gstatic acontecia em tempo de compilação e, numa rede
// lenta, bloqueava a emissão do chunk `app/layout.js` para além do timeout de
// 120s do webpack no browser -> ChunkLoadError. Servir os .woff2 do próprio
// repo elimina a rede do caminho crítico da compilação (e funciona offline).
// Sora e Inter são ficheiros variáveis (um .woff2 cobre toda a gama de pesos).
const sora = localFont({
  src: "./fonts/sora.woff2",
  weight: "600 800",
  variable: "--font-sora",
  display: "swap",
});
const inter = localFont({
  src: "./fonts/inter.woff2",
  weight: "400 600",
  variable: "--font-inter",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

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
    <html lang="pt" className={`${sora.variable} ${inter.variable} ${plexMono.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <ClientInit />
        <ReactQueryProvider>
          <ConfirmProvider>
            <TooltipProvider>
              <ToastProvider>
                <SplashScreen>{children}</SplashScreen>
              </ToastProvider>
            </TooltipProvider>
          </ConfirmProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}