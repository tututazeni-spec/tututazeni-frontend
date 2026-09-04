// components/courses-learn/CourseAvatarReaderExample.tsx
//
// EXEMPLO DE INTEGRAÇÃO — mostra apenas COMO e ONDE colocar o
// CourseAvatarReader dentro de uma página de aula. Não é usado pela
// página real (app/(platform)/courses/[courseId]/learn/page.tsx) — o
// `LessonContent` abaixo não está importado em lado nenhum, tal como no
// ficheiro original de onde foi extraído; mantido como documentação/
// exemplo de referência, não como código morto sem valor.
//
// PASSO 1: Coloca o ficheiro CourseAvatarReader.tsx em src/components/
// PASSO 2: Coloca a imagem do teu avatar em public/images/avatar.png
// PASSO 3: Importa e adiciona o componente conforme abaixo
//
// =============================================================================

'use client';

import { sanitizeHtml } from '@/lib/sanitize';
import { CourseAvatarReader } from '@/components/CourseAvatarReader';
import type { Lesson } from './types';

// =============================================================================
// INTEGRAÇÃO NO COMPONENTE DE AULA
// =============================================================================
//
// Regra: o avatar SÓ aparece se contentType === 'TEXT' E textContent existir
// Desta forma não interfere com vídeos, PDFs, etc.
//
// Exemplo de como renderizar dentro da tua página de aula:

interface LessonContentProps {
  lesson: Lesson;
}

export function LessonContent({ lesson }: LessonContentProps) {
  const isTextLesson = lesson.contentType === 'TEXT' && !!lesson.textContent;

  return (
    <div className="relative">
      {/* ─── Conteúdo da aula ─────────────────────────────────────────────── */}
      <div className="prose prose-sm max-w-none text-ink leading-relaxed">
        {lesson.textContent && (
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(lesson.textContent),
            }}
          />
        )}
      </div>

      {/* ─── Avatar de leitura — SÓ para aulas em texto ──────────────────── */}
      {isTextLesson && (
        <CourseAvatarReader
          lessonId={lesson.id}
          text={lesson.textContent!}
          avatarSrc="/images/avatar.png" // ← caminho da tua imagem
          avatarName="Ana — INNOVA Academy" // ← nome do teu avatar
          lang="pt-PT" // ← idioma da voz
        />
      )}
    </div>
  );
}

// =============================================================================
// CONFIGURAÇÃO DO AVATAR
// =============================================================================
//
// Props disponíveis em <CourseAvatarReader>:
//
//   text        (obrigatório) — texto da aula (aceita Markdown e HTML, limpa automaticamente)
//   avatarSrc   (obrigatório) — ex: "/images/meu-avatar.png" ou URL externa
//   avatarName  (opcional)    — nome exibido no card, default: "Assistente INNOVA"
//   lang        (opcional)    — idioma da voz:
//                               "pt-PT" — Português de Portugal
//                               "pt-BR" — Português do Brasil
//                               "en-US" — Inglês americano
//                               "en-GB" — Inglês britânico
//
// =============================================================================
// RECOMENDAÇÕES PARA A IMAGEM DO AVATAR
// =============================================================================
//
//   Formato:     JPG ou PNG
//   Dimensão:    400×400px ou mais (será recortada em círculo)
//   Estilo:      Foto ou ilustração com rosto bem centrado
//   Fundo:       Preferencialmente liso ou removido (sem fundo)
//   Tamanho:     < 200KB recomendado para carregamento rápido
//   Localização: public/images/avatar.png (ou qualquer path em /public)
//
// =============================================================================
// COMO FUNCIONA (FLUXO DO UTILIZADOR)
// =============================================================================
//
//  1. Utilizador abre uma aula em TEXTO
//  2. Aparece no canto inferior direito um botão flutuante "Ouvir aula"
//     com uma miniatura do avatar (o botão pisca suavemente para chamar atenção)
//
//  3. Utilizador clica → o player expande com:
//     • Foto do avatar em círculo
//     • Animação de ondas quando a voz está activa
//     • Barra de progresso da leitura
//     • Botões: ▶ Play / ⏸ Pause / ⏹ Stop / ⏮ Reiniciar
//
//  4. Clicar ✕ no player → fecha e cancela a leitura
//
//  5. O avatar NÃO aparece em:
//     • Aulas de vídeo (contentType: 'VIDEO')
//     • Aulas de PDF (contentType: 'PDF')
//     • Outros tipos que não sejam TEXT
//
// =============================================================================
// NOTAS TÉCNICAS
// =============================================================================
//
//  • Usa a Web Speech API nativa do browser (SpeechSynthesis)
//    — sem custos, sem API keys, funciona offline
//    — suporte: Chrome / Edge / Firefox / Safari (excl. alguns browsers antigos)
//
//  • Se o browser não suportar SpeechSynthesis, o componente não renderiza
//    (sem erros, sem interface quebrada)
//
//  • O texto é limpo automaticamente de Markdown e HTML antes de ser lido
//
//  • A voz é definida pelo browser — não é a voz do avatar real.
//    Para usar uma voz clonada/personalizada, podes integrar a API
//    ElevenLabs ou Azure Cognitive Speech (substituir o bloco speakChunk)
//
// =============================================================================
//
// Nota: a página real exporta CourseLearnPage como default (ver
// app/(platform)/courses/[courseId]/learn/page.tsx). LessonContent é um
// componente de exemplo/documentação — não pode ser um segundo export
// default.
//
// Setup do CourseAvatarReader (ElevenLabs): ver cabeçalho de
// components/CourseAvatarReader.tsx — a chave fica no .env do BACKEND
// (ELEVENLABS_API_KEY/VOICE_ID), nunca em NEXT_PUBLIC_*. O componente chama
// GET /lessons/:id/audio e requer a prop lessonId (ver exemplo acima).
