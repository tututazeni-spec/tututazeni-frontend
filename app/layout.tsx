import './globals.css';
import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import localFont from 'next/font/local';
import ClientInit from '../components/ClientInit';
import ReactQueryProvider from '../providers/ReactQueryProvider';
import { ConfirmProvider } from '../providers/ConfirmProvider';
import { TooltipProvider } from '../components/ui/Tooltip';
import { ToastProvider } from '../providers/ToastProvider';
import { GlobalErrorHandlers } from '../components/GlobalErrorHandlers';
import SplashScreen from '../components/SplashScreen';
import { parseTheme, THEME_COOKIE } from '../lib/theme';

// Fontes self-hosted (subset latin) em vez de next/font/google. O fetch a
// fonts.googleapis.com/gstatic acontecia em tempo de compilação e, numa rede
// lenta, bloqueava a emissão do chunk `app/layout.js` para além do timeout de
// 120s do webpack no browser -> ChunkLoadError. Servir os .woff2 do próprio
// repo elimina a rede do caminho crítico da compilação (e funciona offline).
// Inter é um ficheiro variável (um .woff2 cobre toda a gama de pesos) e é a
// única fonte de texto do projecto — também nos títulos (font-display).
const inter = localFont({
  src: './fonts/inter.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});
const plexMono = localFont({
  src: [
    { path: './fonts/plex-mono-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/plex-mono-500.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | INNOVA',
    default: 'INNOVA',
  },
  // Plataforma interna: nunca indexar em motores de busca.
  robots: { index: false, follow: false },
};

// design system é light-only (sem variantes [data-theme=dark]/prefers-color-
// scheme, ver globals.css) — sem isto, o "Auto Dark Mode" do Chrome/Edge
// tenta reescrever as cores da página sozinho, e o heurístico falha em
// conteúdo montado dinamicamente num Portal (modais, toasts): o texto de um
// título fica com uma cor quase igual ao fundo que o browser escureceu por
// cima, ilegível, sem que nada no nosso CSS tenha mudado. Declarar
// color-scheme diz ao browser para não tentar.
//
// Com o tema escuro (cookie `innova-theme`, ver lib/theme.ts) a meta passa a
// declarar o esquema real: 'light' | 'dark' | 'light dark' (sistema).
export async function generateViewport(): Promise<Viewport> {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return {
    colorScheme: theme === 'system' ? 'light dark' : theme,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Força renderização dinâmica: o nonce da CSP é por pedido (middleware.ts) e
  // uma página pré-renderizada em build ficaria com scripts sem nonce → bloqueados.
  await headers();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="pt"
      data-theme={theme}
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <body style={{ margin: 0, padding: 0 }}>
        <ClientInit />
        <GlobalErrorHandlers />
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
