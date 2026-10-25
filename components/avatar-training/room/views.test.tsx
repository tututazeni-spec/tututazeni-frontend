// As vistas da sala renderizam só com props: sem QueryClient, sem apiClient,
// sem ConfirmProvider e sem síntese de voz.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionBar } from './ActionBar';
import { ResultPanel } from './ResultPanel';
import { StepPanel } from './StepPanel';
import { VoiceControls } from './VoiceControls';
import type { TrainingRoomController } from '@/hooks/useTrainingRoom';
import type { CompleteResult, RoomStep } from '../types';

const fn = () => vi.fn();

function makeCtl(over: Record<string, unknown> = {}) {
  const ctl = {
    open: true,
    paused: false,
    allDone: false,
    step: { key: 's1', title: 'Introdução', type: 'CONTENT' },
    voiceOn: false,
    lastAvatar: undefined,
    voice: { speaking: false, activeCue: null, engine: null },
    captions: true,
    setCaptions: fn(),
    askNotice: false,
    setAskNotice: fn(),
    result: null,
    certification: undefined,
    certificateRequested: false,
    toggleVoice: fn(),
    toggleStepSpeech: fn(),
    confirmVoice: fn(),
    speakLast: fn(),
    resume: fn(),
    pause: fn(),
    explainDifferently: fn(),
    requestHumanHelp: fn(),
    complete: fn(),
    endSession: fn(),
    requestCertificate: fn(),
    pending: {
      media: false,
      ask: false,
      explain: false,
      record: false,
      complete: false,
      abandon: false,
      certificate: false,
    },
    ...over,
  };
  return ctl as unknown as TrainingRoomController & typeof ctl;
}

const btn = (name: string) => screen.getByRole('button', { name });

describe('ActionBar', () => {
  it('em curso mostra «Pausar»; pausada mostra «Retomar»', () => {
    const running = makeCtl();
    const { unmount } = render(<ActionBar ctl={running} />);
    fireEvent.click(btn('Pausar'));
    expect(running.pause).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Retomar' })).toBeNull();
    unmount();

    const paused = makeCtl({ paused: true });
    render(<ActionBar ctl={paused} />);
    fireEvent.click(btn('Retomar'));
    expect(paused.resume).toHaveBeenCalledTimes(1);
    // em pausa não se pede ajuda nem se conclui
    expect((btn('Concluir sessão') as HTMLButtonElement).disabled).toBe(true);
    expect((btn('Falar com um formador') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('sessão já fechada não mostra acções', () => {
    const { container } = render(<ActionBar ctl={makeCtl({ open: false })} />);
    expect(container.textContent).toBe('');
  });

  it('«Ouvir a última resposta» só com voz ligada e resposta do instrutor', () => {
    const without = makeCtl({ voiceOn: true });
    const { unmount } = render(<ActionBar ctl={without} />);
    expect(
      screen.queryByRole('button', { name: 'Ouvir a última resposta' }),
    ).toBeNull();
    unmount();

    const withReply = makeCtl({ voiceOn: true, lastAvatar: { content: 'x' } });
    render(<ActionBar ctl={withReply} />);
    fireEvent.click(btn('Ouvir a última resposta'));
    expect(withReply.speakLast).toHaveBeenCalledTimes(1);
  });

  it('concluir e terminar delegam no controller', () => {
    const ctl = makeCtl({ allDone: true });
    render(<ActionBar ctl={ctl} />);
    fireEvent.click(btn('Concluir sessão'));
    fireEvent.click(btn('Terminar sessão'));
    expect(ctl.complete).toHaveBeenCalledTimes(1);
    expect(ctl.endSession).toHaveBeenCalledTimes(1);
  });
});

describe('ResultPanel', () => {
  const result = (over: Partial<CompleteResult> = {}): CompleteResult => ({
    attemptId: 1,
    status: 'COMPLETED',
    score: 85,
    passed: true,
    passingScore: 70,
    ...over,
  });

  it('sem resultado não renderiza nada', () => {
    const { container } = render(<ResultPanel ctl={makeCtl()} />);
    expect(container.firstChild).toBeNull();
  });

  it('mostra aprovação, nota e mínimo', () => {
    render(<ResultPanel ctl={makeCtl({ result: result() })} />);
    expect(screen.getByText('Aprovado.')).toBeTruthy();
    expect(screen.getByText('Nota: 85 (mínimo 70)')).toBeTruthy();
  });

  it('elegível: «Pedir certificado» dispara o pedido; depois fica desativado', () => {
    const ctl = makeCtl({
      result: result(),
      certification: { enabled: true, eligible: true, reasons: [] },
    });
    const { unmount } = render(<ResultPanel ctl={ctl} />);
    fireEvent.click(btn('Pedir certificado'));
    expect(ctl.requestCertificate).toHaveBeenCalledTimes(1);
    unmount();

    render(
      <ResultPanel
        ctl={makeCtl({
          result: result(),
          certification: { enabled: true, eligible: true, reasons: [] },
          certificateRequested: true,
        })}
      />,
    );
    expect((btn('Pedir certificado') as HTMLButtonElement).disabled).toBe(true);
  });

  it('não elegível: explica porquê e não oferece o pedido', () => {
    render(
      <ResultPanel
        ctl={makeCtl({
          result: result(),
          certification: {
            enabled: true,
            eligible: false,
            reasons: ['Faltam sessões'],
          },
        })}
      />,
    );
    expect(
      screen.getByText('Certificado ainda não disponível: Faltam sessões.'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Pedir certificado' }),
    ).toBeNull();
  });
});

describe('VoiceControls', () => {
  it('marcar «Voz do instrutor» passa o estado ao controller', () => {
    const ctl = makeCtl();
    render(<VoiceControls ctl={ctl} />);
    fireEvent.click(screen.getByLabelText('Voz do instrutor'));
    expect(ctl.toggleVoice).toHaveBeenCalledWith(true);
  });

  it('aviso de IA: confirmar liga a voz, recusar só fecha o aviso', () => {
    const ctl = makeCtl({ askNotice: true });
    render(<VoiceControls ctl={ctl} />);
    fireEvent.click(btn('Compreendo e quero activar a voz'));
    expect(ctl.confirmVoice).toHaveBeenCalledTimes(1);
    fireEvent.click(btn('Continuar só por texto'));
    expect(ctl.setAskNotice).toHaveBeenCalledWith(false);
  });
});

describe('StepPanel', () => {
  const step = (over: Partial<RoomStep> = {}): RoomStep => ({
    key: 's1',
    title: 'Segurança',
    type: 'CONTENT',
    ...over,
  });

  it('etapa sem pergunta: «Continuar» avança', () => {
    const onAdvance = vi.fn();
    render(
      <StepPanel
        step={step()}
        disabled={false}
        language="pt"
        onAnswer={vi.fn()}
        onAdvance={onAdvance}
      />,
    );
    fireEvent.click(btn('Continuar'));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('verdadeiro/falso: cada opção é uma resposta', () => {
    const onAnswer = vi.fn();
    render(
      <StepPanel
        step={step({ question: { kind: 'TRUE_FALSE', prompt: 'É seguro?' } })}
        disabled={false}
        language="pt"
        onAnswer={onAnswer}
        onAdvance={vi.fn()}
      />,
    );
    fireEvent.click(btn('Falso'));
    expect(onAnswer).toHaveBeenCalledWith('Falso');
  });

  it('resposta livre: aparara o texto e limpa a caixa depois de enviar', () => {
    const onAnswer = vi.fn();
    render(
      <StepPanel
        step={step({ question: { kind: 'SHORT', prompt: 'Explique' } })}
        disabled={false}
        language="pt"
        onAnswer={onAnswer}
        onAdvance={vi.fn()}
      />,
    );
    const box = screen.getByLabelText('A sua resposta') as HTMLTextAreaElement;
    expect((btn('Responder') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(box, { target: { value: '  Porque sim  ' } });
    fireEvent.click(btn('Responder'));
    expect(onAnswer).toHaveBeenCalledWith('Porque sim');
    expect(box.value).toBe('');
  });
});
