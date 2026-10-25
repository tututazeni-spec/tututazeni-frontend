// components/avatar-training/BuilderTab.tsx
// Construtor de Sessões (docs/Avatar_Training.md §7): dados da sessão, etapas
// (conteúdo, pergunta, cenário, exercício), gabarito e atribuição a
// colaboradores. O backend valida as etapas (chaves únicas, mínimo de opções,
// resposta correcta entre as opções) — os erros são mostrados tal como vêm.
//
// Container: liga os hooks de dados às vistas de apresentação em ./builder/.
//   hooks/useSessionBuilder.ts  dados da sessão, etapas e gravação
//   hooks/useAssignSession.ts   atribuição a colaboradores
//   hooks/useNewSession.ts      criar sessão
//   ./builder/logic.ts          regras puras (etapas, ramificações, payloads)

'use client';

import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { useAssignSession } from '@/hooks/useAssignSession';
import { useNewSession } from '@/hooks/useNewSession';
import { useSessionBuilder } from '@/hooks/useSessionBuilder';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { AssignBoxView } from './builder/AssignBoxView';
import { NewSessionView } from './builder/NewSessionView';
import { SessionFormView } from './builder/SessionFormView';
import { SessionPicker, useSessionDetail } from './SessionPicker';
import type { SessionDetail } from './types';

function AssignBox({
  sessionId,
  published,
}: {
  sessionId: number;
  published: boolean;
}) {
  return (
    <AssignBoxView ctl={useAssignSession(sessionId)} published={published} />
  );
}

function SessionForm({ session }: { session: SessionDetail }) {
  const ctl = useSessionBuilder(session);
  return (
    <SessionFormView
      ctl={ctl}
      assignBox={
        <AssignBox
          sessionId={session.id}
          published={session.status === 'PUBLISHED'}
        />
      }
    />
  );
}

function NewSession({ onCreated }: { onCreated: (id: number) => void }) {
  return <NewSessionView ctl={useNewSession(onCreated)} />;
}

export function BuilderTab() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const { data, error, refetch } = useSessionDetail(sessionId);

  return (
    <div className="space-y-4">
      <NewSession onCreated={setSessionId} />
      <SessionPicker value={sessionId} onChange={setSessionId} />
      {sessionId === null ? (
        <EmptyState
          icon={Wrench}
          title="Escolha ou crie uma sessão"
          description="Configure etapas, perguntas e gabarito; depois submeta a formação a revisão para publicar."
        />
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : (
        data && (
          <SessionForm
            key={`${data.id}-${data.version}-${data.steps.length}`}
            session={data}
          />
        )
      )}
    </div>
  );
}
