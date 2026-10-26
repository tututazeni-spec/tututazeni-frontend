import { Suspense } from 'react';
import '../globals.css';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { SessionActivityTracker } from '../../components/SessionActivityTracker';
import { TabFromUrl } from '../../components/TabFromUrl';
import { OfflineBanner } from '../../components/OfflineBanner';
import { SkipLink } from '../../components/ui/SkipLink';
import { FrontendPerfReporter } from '../../components/scalability/FrontendPerfReporter';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', margin: 0, padding: 0 }}>
      <SkipLink />
      <FrontendPerfReporter />
      <SessionActivityTracker />
      <Suspense fallback={null}>
        <TabFromUrl />
      </Suspense>
      <Sidebar />
      <div
        style={{
          marginLeft: '240px',
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Topbar />
        <main
          id="conteudo-principal"
          tabIndex={-1}
          style={{
            flex: 1,
            outline: 'none', // destino do skip-link (tabIndex -1): sem anel ao receber foco
            padding: '32px',
            marginTop: '56px',
            background: 'var(--color-canvas)',
          }}
        >
          <OfflineBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
