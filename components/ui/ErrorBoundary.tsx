// components/ui/ErrorBoundary.tsx
// Error boundary reutilizável para isolar widgets que podem rebentar em
// runtime (parsing de dados inesperados, libs de terceiros como gráficos)
// sem levar a página inteira consigo. app/error.tsx só apanha erros ao
// nível da rota — isto cobre um widget dentro de uma página que continua
// a precisar do resto funcional.

'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { reportError, friendlyMessage } from '@/lib/errorReporting';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Identifica o widget/secção para efeitos de reporting. */
  source: string;
  /** Fallback customizado; recebe o erro e uma função retry. */
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, {
      source: this.props.source,
      componentStack: info.componentStack,
    });
  }

  retry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.retry);

    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface p-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-subtle">
          <AlertTriangle size={20} strokeWidth={1.75} className="text-danger" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-ink">
            Algo correu mal neste componente
          </h3>
          <p className="mt-1 max-w-xs font-body text-xs text-ink-muted">
            {friendlyMessage(error)}
          </p>
        </div>
        <Button size="sm" onClick={this.retry}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
