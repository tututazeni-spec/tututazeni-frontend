import { Suspense } from 'react';
import '../globals.css';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { SessionActivityTracker } from '../../components/SessionActivityTracker';
import { TabFromUrl } from '../../components/TabFromUrl';
import { OfflineBanner } from '../../components/OfflineBanner';
import { SkipLink } from '../../components/ui/SkipLink';
import { UsageTracker } from '../../components/product/UsageTracker';
import { NpsSurvey } from '../../components/product/NpsSurvey';
import { LegalGate } from '../../components/legal/LegalGate';
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
      <UsageTracker />
      <LegalGate />
      <Suspense fallback={null}>
        <TabFromUrl />
      </Suspense>
      <Sidebar />
      <div
        className="app-shell-content"
        style={{
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
          className="app-main"
          tabIndex={-1}
          style={{
            flex: 1,
            outline: 'none', // destino do skip-link (tabIndex -1): sem anel ao receber foco
            marginTop: '56px',
            background: 'var(--color-canvas)',
          }}
        >
          <OfflineBanner />
          {children}
        </main>
        <NpsSurvey />
      </div>
    </div>
  );
}
