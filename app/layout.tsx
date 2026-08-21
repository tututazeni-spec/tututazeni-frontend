import "./globals.css";
import type { Metadata } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import ClientInit from "../components/ClientInit";
import ReactQueryProvider from "../providers/ReactQueryProvider";
import { ConfirmProvider } from "../providers/ConfirmProvider";
import { TooltipProvider } from "../components/ui/Tooltip";
import { ToastProvider } from "../providers/ToastProvider";
import SplashScreen from "../components/SplashScreen";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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