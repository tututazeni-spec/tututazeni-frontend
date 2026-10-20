import { Suspense } from 'react';
import '../globals.css';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { SessionActivityTracker } from '../../components/SessionActivityTracker';
import { TabFromUrl } from '../../components/TabFromUrl';
import { FrontendPerfReporter } from '../../components/scalability/FrontendPerfReporter';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', margin: 0, padding: 0 }}>
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
          style={{
            flex: 1,
            padding: '32px',
            marginTop: '56px',
            background: 'var(--color-canvas)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
