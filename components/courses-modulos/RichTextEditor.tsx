// components/courses-modulos/RichTextEditor.tsx
// Editor de texto formatado para lições (negrito, títulos, listas, citação,
// ligações). Sem dependências novas: contentEditable + document.execCommand
// (obsoleto mas suportado em todos os browsers, e suficiente para este
// conjunto pequeno de formatos). O HTML que sai é sempre sanitizado, e o que
// se cola é reduzido ao mesmo conjunto de tags — nunca HTML do Word tal e qual.
// Texto simples antigo (sem tags) é convertido em parágrafos ao abrir.

'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Underline,
} from 'lucide-react';
import { isHtmlEmpty, lessonTextToHtml } from '@/lib/lessonHtml';
import { sanitizeHtml } from '@/lib/sanitize';

interface RichTextEditorProps {
  id?: string;
  /** Valor inicial (HTML ou texto simples). O editor é não-controlado. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolProps {
  label: string;
  onRun: () => void;
  children: ReactNode;
}

function Tool({ label, onRun, children }: ToolProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // mouseDown (e não click) + preventDefault: mantém a selecção no texto.
      onMouseDown={(e) => {
        e.preventDefault();
        onRun();
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink"
    >
      {children}
    </button>
  );
}

function exec(command: string, arg?: string) {
  document.execCommand(command, false, arg);
}

const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = 'Escreva o conteúdo da lição…',
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [empty, setEmpty] = useState(isHtmlEmpty(value));

  // Carrega o valor inicial uma só vez, ao montar; depois o DOM é a fonte de verdade.
  const initialised = useRef(false);
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      if (el && !initialised.current) {
        initialised.current = true;
        el.innerHTML = lessonTextToHtml(value);
      }
    },
    [value],
  );

  function emit() {
    const html = sanitizeHtml(ref.current?.innerHTML ?? '');
    const blank = isHtmlEmpty(html);
    setEmpty(blank);
    onChange(blank ? '' : html);
  }

  function run(command: string, arg?: string) {
    ref.current?.focus();
    exec(command, arg);
    emit();
  }

  function openLink() {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    setLinkUrl('');
    setLinkOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    setLinkOpen(false);
    if (!SAFE_LINK.test(url)) return;
    ref.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    exec('createLink', url);
    emit();
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (html) exec('insertHTML', sanitizeHtml(html));
    else exec('insertText', text);
    emit();
  }

  return (
    <div className="rounded-lg border border-border bg-surface focus-within:border-primary">
      <div
        role="toolbar"
        aria-label="Formatação do texto"
        className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1"
      >
        <Tool label="Negrito" onRun={() => run('bold')}>
          <Bold size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Itálico" onRun={() => run('italic')}>
          <Italic size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Sublinhado" onRun={() => run('underline')}>
          <Underline size={16} strokeWidth={1.75} />
        </Tool>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Tool label="Título" onRun={() => run('formatBlock', 'h2')}>
          <Heading2 size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Subtítulo" onRun={() => run('formatBlock', 'h3')}>
          <Heading3 size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Parágrafo" onRun={() => run('formatBlock', 'p')}>
          <Pilcrow size={16} strokeWidth={1.75} />
        </Tool>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Tool label="Lista" onRun={() => run('insertUnorderedList')}>
          <List size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Lista numerada" onRun={() => run('insertOrderedList')}>
          <ListOrdered size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Citação" onRun={() => run('formatBlock', 'blockquote')}>
          <Quote size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Ligação" onRun={openLink}>
          <Link2 size={16} strokeWidth={1.75} />
        </Tool>
        <Tool label="Limpar formatação" onRun={() => run('removeFormat')}>
          <Eraser size={16} strokeWidth={1.75} />
        </Tool>
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-2 py-1.5">
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinkOpen(false);
            }}
            placeholder="https://…"
            aria-label="Endereço da ligação"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-canvas"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            className="text-xs text-ink-muted underline"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute left-3 top-2 font-body text-sm text-ink-faint">
            {placeholder}
          </span>
        )}
        <div
          ref={attach}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-label="Conteúdo da lição"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          className="min-h-[180px] max-h-[360px] overflow-y-auto px-3 py-2 font-body text-sm leading-relaxed text-ink outline-none break-words [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:font-semibold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic"
        />
      </div>
    </div>
  );
}
