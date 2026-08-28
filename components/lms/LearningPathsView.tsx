// components/lms/LearningPathsView.tsx

import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { CardGridSkeleton, ErrorBanner } from './shared';
import { LEVEL_INTENT } from './types';
import type { Path } from './types';

interface LearningPathsViewProps {
  data: Path[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (updater: (p: number) => number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  enroll: (pathId: string) => void;
}

export function LearningPathsView({
  data,
  total,
  totalPages,
  page,
  setPage,
  search,
  onSearchChange,
  loading,
  error,
  onRetry,
  enroll,
}: LearningPathsViewProps) {
  if (loading) return <CardGridSkeleton />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Percursos de Aprendizagem
          </h1>
          <p className="font-body text-ink-muted">{total} percursos disponíveis</p>
        </div>
        <div className="flex gap-2">
          <a href="/lms/sessions" className={buttonVariants({ intent: 'secondary' })}>
            Sessões ao Vivo
          </a>
          <a href="/lms/my-paths" className={buttonVariants({ intent: 'primary' })}>
            Os Meus Percursos
          </a>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Pesquisar percursos..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full max-w-md"
      />

      {data.length === 0 ? (
        <EmptyState
          title="Nenhum percurso encontrado"
          description="Experimenta ajustar os termos da pesquisa."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary to-accent text-3xl text-canvas">
                🎓
              </div>
              <CardBody className="flex flex-1 flex-col">
                <div className="mb-2 flex items-start justify-between">
                  <span className="font-data text-xs text-primary">{p.code}</span>
                  <Badge intent={LEVEL_INTENT[p.level] ?? 'neutral'}>{p.level}</Badge>
                </div>
                <h3 className="mb-2 font-display text-sm font-semibold text-ink">{p.name}</h3>
                <p className="mb-3 line-clamp-2 font-body text-sm text-ink-muted">
                  {p.description || ''}
                </p>
                <div className="mb-3 mt-auto flex items-center justify-between font-body text-xs text-ink-faint">
                  <span>{p.estimatedHours || '—'}h</span>
                  <span>{p._count?.enrollments || 0} inscritos</span>
                </div>
                <Button size="sm" className="w-full" onClick={() => enroll(p.id)}>
                  Inscrever-me
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-body text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
