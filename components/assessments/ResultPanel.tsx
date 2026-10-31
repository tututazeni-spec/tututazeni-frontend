// components/assessments/ResultPanel.tsx
// Painel de resultado no desenho de public/images/resultado do curso.jpeg:
// fundo azul claro com círculos nos cantos, selo redondo com confetes, a nota
// grande, o estado, a barra "Pontuação obtida" e a "Revisão das respostas".
// Partilhado pelo resultado logo após a avaliação (ResultView) e pelo "Ver
// resultado" das avaliações formais (FormalEvaluationMyResult).

import { Check, Hourglass, Lightbulb, Paperclip, X } from 'lucide-react';

export type ResultTone = 'pass' | 'fail' | 'pending';

export interface ResultReviewItem {
  id: number;
  text: string;
  /** true certa, false errada, null aguarda revisão. */
  correct: boolean | null;
  explanation?: string | null;
  /** O que o utilizador respondeu (texto das opções ou resposta escrita). */
  yourAnswer?: string | null;
  /** Resposta certa, quando a correcção a revela. */
  correctAnswer?: string | null;
  /** Comentário de quem reviu a resposta aberta. */
  comment?: string | null;
  /** Resposta aberta (corrigida à mão): mostra a nota atribuída em vez de certa/errada. */
  open?: boolean;
  /** Nota atribuída pelo revisor (0-100), nas respostas abertas já revistas. */
  grade?: number | null;
  /** Link do ficheiro enviado (pergunta de upload). */
  fileUrl?: string | null;
}

interface ResultPanelProps {
  tone: ResultTone;
  /** Nota em destaque (ex.: "100%"). */
  headline: string;
  /** Linha por baixo do estado (ex.: "3/3 corretas · Mínimo: 70%"). */
  detail: string;
  /** Percentagem obtida (0-100) para a barra; omitir esconde a barra. */
  score?: number;
  passingScore: number;
  review?: ResultReviewItem[];
  /** Conteúdo extra por baixo (ex.: data de submissão). */
  footer?: React.ReactNode;
}

const TONE = {
  pass: { circle: 'bg-success', label: 'Aprovado!' },
  fail: { circle: 'bg-danger', label: 'Reprovado' },
  pending: { circle: 'bg-warning', label: 'Aguarda revisão manual' },
} as const;

const CONFETTI = [
  { cls: 'left-[18%] top-[14%] h-2 w-2 bg-warning', rot: 'rotate-12' },
  { cls: 'left-[30%] top-[7%] h-2.5 w-1 bg-success', rot: '-rotate-45' },
  { cls: 'left-[26%] top-[26%] h-1.5 w-1.5 bg-info', rot: '' },
  { cls: 'right-[30%] top-[8%] h-2.5 w-1 bg-danger', rot: 'rotate-45' },
  { cls: 'right-[22%] top-[17%] h-1.5 w-1.5 bg-warning', rot: '' },
  { cls: 'right-[34%] top-[27%] h-2 w-2 bg-info', rot: 'rotate-12' },
];

function fileKind(url: string): 'image' | 'pdf' | 'other' {
  const clean = url.split(/[?#]/)[0].toLowerCase();
  if (
    url.startsWith('data:image/') ||
    /\.(png|jpe?g|gif|webp|svg)$/.test(clean)
  )
    return 'image';
  if (url.startsWith('data:application/pdf') || clean.endsWith('.pdf'))
    return 'pdf';
  return 'other';
}

/** Ficheiro enviado na resposta, mostrado dentro do resultado. */
function UploadedFile({ url }: { url: string }) {
  const kind = fileKind(url);
  const name = decodeURIComponent(
    url.startsWith('data:')
      ? 'Ficheiro enviado'
      : (url.split(/[?#]/)[0].split('/').pop() ?? 'Ficheiro enviado'),
  );
  return (
    <div className="overflow-hidden rounded-card border border-brand-line bg-brand-soft">
      {kind === 'image' && (
        // Pode ser data URL (base64) — <img> nativo.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={url}
          alt="Ficheiro enviado"
          className="max-h-64 w-full object-contain bg-white"
        />
      )}
      {kind === 'pdf' && (
        <iframe
          src={url}
          title="Ficheiro enviado"
          className="h-72 w-full bg-white"
        />
      )}
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <Paperclip
          size={14}
          strokeWidth={1.75}
          className="shrink-0 text-brand-muted"
        />
        <span className="min-w-0 flex-1 truncate font-medium text-brand">
          {name}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 font-semibold text-info-ink underline"
        >
          Abrir
        </a>
      </div>
    </div>
  );
}

export function ResultPanel({
  tone,
  headline,
  detail,
  score,
  passingScore,
  review = [],
  footer,
}: ResultPanelProps) {
  const cfg = TONE[tone];
  const Icon = tone === 'pass' ? Check : tone === 'fail' ? X : Hourglass;

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-panel border border-brand-line bg-brand-soft px-6 pb-6 pt-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-brand-line"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-brand-line"
      />

      <div className="relative text-center">
        <div className="relative mx-auto mb-3 h-24 w-48">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className={`absolute rounded-[2px] ${c.cls} ${c.rot}`}
            />
          ))}
          <span
            className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md ${cfg.circle}`}
          >
            <Icon size={34} strokeWidth={3} />
          </span>
        </div>
        <div className="font-data text-6xl font-extrabold leading-none text-brand">
          {headline}
        </div>
        <div className="mt-2 font-body text-3xl font-extrabold text-brand">
          {cfg.label}
        </div>
        <div className="mt-2 text-sm text-brand-muted">{detail}</div>
      </div>

      {score !== undefined && (
        <div className="relative mt-6 rounded-card border border-brand-line bg-brand-soft p-4">
          <div className="mb-2 flex justify-between text-xs font-medium text-brand">
            <span>Pontuação obtida</span>
            <span>Mínimo: {passingScore}%</span>
          </div>
          <div className="relative h-3.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-info"
              style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
            />
            <div
              aria-hidden
              className="absolute bottom-0 top-0 w-0.5 bg-brand/60"
              style={{ left: `${passingScore}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-brand-muted">
            {score}%
          </div>
        </div>
      )}

      {review.length > 0 && (
        <div className="relative mt-6">
          <div className="mb-3 text-sm font-bold text-brand">
            Revisão das respostas
          </div>
          <div className="space-y-2.5">
            {review.map((r) => (
              <div
                key={r.id}
                className="rounded-card border border-brand-line bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                      r.correct === null
                        ? 'bg-warning'
                        : r.correct
                          ? 'bg-success'
                          : 'bg-danger'
                    }`}
                  >
                    {r.correct === null ? (
                      <Hourglass size={14} strokeWidth={2.5} />
                    ) : r.correct ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <X size={16} strokeWidth={3} />
                    )}
                  </span>
                  <span className="text-sm font-medium text-brand">
                    {r.text}
                  </span>
                </div>
                {r.open && r.correct === null && (
                  <div className="mt-2 pl-10 text-xs font-medium text-warning-ink">
                    Aguarda revisão manual
                  </div>
                )}
                {r.open && r.grade != null && (
                  <div className="mt-2 pl-10 text-xs text-brand-muted">
                    Nota atribuída:{' '}
                    <span className="font-semibold text-brand">{r.grade}%</span>
                  </div>
                )}
                {r.fileUrl && (
                  <div className="mt-2 pl-10">
                    <UploadedFile url={r.fileUrl} />
                  </div>
                )}
                {(r.yourAnswer ||
                  (r.correctAnswer && (r.open || r.correct === false))) && (
                  <div className="mt-2 space-y-0.5 pl-10 text-xs">
                    {r.yourAnswer && (
                      <p className="text-brand-muted">
                        A tua resposta:{' '}
                        <span className="font-semibold text-brand">
                          {r.yourAnswer}
                        </span>
                      </p>
                    )}
                    {(r.open || r.correct === false) && r.correctAnswer && (
                      <p className="text-brand-muted">
                        {r.open
                          ? 'Resposta de referência'
                          : 'Resposta correcta'}
                        :{' '}
                        <span className="font-semibold text-success-ink">
                          {r.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {r.comment && (
                  <div className="mt-2 pl-10 text-xs italic text-brand-muted">
                    Comentário: {r.comment}
                  </div>
                )}
                {r.explanation && (
                  <div className="mt-2 pl-10 text-xs text-brand-muted">
                    <Lightbulb
                      size={13}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    {r.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {footer && (
        <div className="relative mt-5 text-center text-xs text-brand-muted">
          {footer}
        </div>
      )}
    </div>
  );
}
