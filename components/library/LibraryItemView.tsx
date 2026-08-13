// components/library/LibraryItemView.tsx

import { ArrowLeft, Download, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Info } from './shared';
import { TYPE_ICONS } from './types';
import type { ItemDetail } from './types';

interface LibraryItemViewProps {
  item: ItemDetail;
  score: number;
  setScore: (score: number) => void;
  comment: string;
  setComment: (comment: string) => void;
  newComment: string;
  setNewComment: (comment: string) => void;
  download: () => void;
  submitRating: (e: React.FormEvent) => void;
  submitComment: (e: React.FormEvent) => void;
  saving: boolean;
}

export function LibraryItemView({
  item,
  score,
  setScore,
  comment,
  setComment,
  newComment,
  setNewComment,
  download,
  submitRating,
  submitComment,
  saving,
}: LibraryItemViewProps) {
  const router = useRouter();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <Button intent="ghost" size="sm" onClick={() => router.push('/library')}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar à biblioteca
      </Button>

      {/* Cabeçalho */}
      <Card>
        <CardBody className="flex gap-6">
          <div className="text-6xl">{TYPE_ICONS[item.type] || '📦'}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">{item.title}</h1>
                {item.subtitle && <p className="font-body text-ink-muted">{item.subtitle}</p>}
                <p className="mt-1 font-data text-xs text-primary">{item.code}</p>
              </div>
              {!item.isApproved && <Badge intent="warning">Por aprovar</Badge>}
            </div>
            <div className="mt-3 flex gap-4 font-body text-sm text-ink-muted">
              <span>👁 {item.views} visualizações</span>
              <span>⬇ {item.downloads} downloads</span>
              {item.rating > 0 && (
                <span>
                  ⭐ {item.rating.toFixed(1)} ({item.ratingCount})
                </span>
              )}
            </div>
            <Button className="mt-4" onClick={download}>
              <Download size={16} strokeWidth={1.75} />
              Descarregar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Metadados */}
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Info label="Autor" value={item.author} />
          <Info label="Editora" value={item.publisher} />
          <Info label="Ano" value={item.year ? String(item.year) : null} />
          <Info label="Idioma" value={item.language} />
          <Info label="Páginas" value={item.pages ? String(item.pages) : null} />
          <Info label="ISBN" value={item.isbn} />
          <Info label="Colecção" value={item.collection?.name} />
          <Info label="Carregado por" value={item.uploadedBy?.fullName} />
          <Info
            label="Categorias"
            value={item.categories?.length ? item.categories.join(', ') : null}
          />
        </CardBody>
      </Card>

      {item.description && (
        <Card>
          <CardBody>
            <h2 className="mb-2 font-body text-xs font-semibold uppercase text-ink-muted">
              Descrição
            </h2>
            <p className="whitespace-pre-line font-body text-sm text-ink">{item.description}</p>
          </CardBody>
        </Card>
      )}

      {/* Avaliar */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Avaliar</h2>
        <Card>
          <CardBody>
            <form onSubmit={submitRating} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                    className={n <= score ? 'text-warning' : 'text-ink-faint'}
                  >
                    <Star
                      size={24}
                      strokeWidth={1.75}
                      fill={n <= score ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
              <Input
                placeholder="Comentário (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full"
              />
              <Button type="submit" disabled={saving}>
                {saving ? 'A guardar...' : 'Submeter avaliação'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </section>

      {/* Comentários */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Comentários ({item._count.comments})
        </h2>
        <form onSubmit={submitComment} className="mb-4 flex gap-2">
          <Input
            placeholder="Escreve um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={saving}>
            Comentar
          </Button>
        </form>
        <Card className="divide-y divide-border">
          {item.comments.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">Ainda sem comentários</p>
          ) : (
            item.comments.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex justify-between">
                  <span className="font-body text-sm font-medium text-ink">
                    {c.user?.fullName || 'Utilizador'}
                  </span>
                  <span className="font-body text-xs text-ink-faint">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 font-body text-sm text-ink-muted">{c.content}</p>
              </div>
            ))
          )}
        </Card>
      </section>
    </div>
  );
}
