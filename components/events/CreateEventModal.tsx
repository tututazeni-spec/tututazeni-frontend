// components/events/CreateEventModal.tsx
// Modal "Criar evento" do módulo de eventos corporativos. Antes o botão
// só disparava um toast "Abrir formulário de criação de evento" e nada
// mais — ver memory project_innova_frontend_placeholder_toast_buttons.
//
// Segue o padrão de components/live-classes/CreateLiveClassModal: a page
// só monta o componente quando está aberto, por isso o Modal fica sempre
// `open` e `onOpenChange` delega em `onClose` (X, clique fora, Escape).
//
// Submete em POST /events (@Roles(ADMIN, RH, GESTOR) no backend) — o
// evento nasce como DRAFT. O botão que abre esta modal já está escondido
// para quem não é ADMIN/RH/GESTOR; aqui só blindamos o payload: datas
// locais -> ISO, capacidade -> número, opcionais vazios omitidos.
//
// Campos por secção (docs/events.md "Ao clicar em Novo Evento"):
// Informações gerais / Data & horário / Local / Inscrições / Configurações.
// "Organizador" não é escolhido aqui — é sempre quem cria o evento
// (organizerId vem do JWT no backend); "Responsável" é um utilizador
// distinto e opcional. Booleans e enums seguem sempre no payload (mesmo
// padrão de CreateCourseModal); strings/ids opcionais só entram quando
// preenchidos.

'use client';

import { useState } from 'react';
import { CourseImageField } from '@/components/courses/CourseImageField';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useFormState } from '@/hooks/useFormState';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { MODALITY_CFG, TYPE_CFG, VISIBILITY_CFG } from './constants';
import { useDepartmentOptions } from './eventFormData';
import type { EventModalidade, EventType, EventVisibility } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

export interface CreateEventModalProps {
  onClose: () => void;
}

const TYPE_ITEMS = Object.entries(TYPE_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const MODALITY_ITEMS = Object.entries(MODALITY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const VISIBILITY_ITEMS = Object.entries(VISIBILITY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

// Listas de escolha (campos opcionais): a primeira opção limpa o valor.
const NONE_ITEM = { value: '', label: 'Nenhum (opcional)' };
const toItems = (labels: string[]) => [
  NONE_ITEM,
  ...labels.map((l) => ({ value: l, label: l })),
];
const CATEGORY_ITEMS = toItems([
  'Cultura organizacional',
  'Formação e desenvolvimento',
  'Liderança e gestão',
  'Segurança e saúde no trabalho',
  'Tecnologia e inovação',
  'Comercial e vendas',
  'Bem-estar e integração',
  'Conformidade e ética',
  'Institucional e celebrações',
]);
const OTHER_VALUE = '__OTHER__';
const OBJECTIVE_LABELS = [
  'Desenvolver competências',
  'Integrar novos colaboradores',
  'Reforçar a cultura e os valores',
  'Partilhar conhecimento',
  'Cumprir requisitos de conformidade',
  'Melhorar o desempenho das equipas',
  'Reconhecer e motivar colaboradores',
  'Comunicar resultados e estratégia',
];
const OBJECTIVE_ITEMS = [
  ...toItems(OBJECTIVE_LABELS),
  { value: OTHER_VALUE, label: 'Outro (escrever manualmente)' },
];
const AUDIENCE_ITEMS = toItems([
  'Todos os colaboradores',
  'Novos colaboradores',
  'Líderes e gestores',
  'Equipas comerciais',
  'Equipas técnicas',
  'Equipas administrativas',
  'Direção',
]);
// Se o valor atual não estiver na lista (ex.: dados antigos), mantém-no visível.
function withCurrent(items: typeof CATEGORY_ITEMS, current: string) {
  return current && !items.some((i) => i.value === current)
    ? [...items, { value: current, label: current }]
    : items;
}

// Plataforma da reunião online: só orienta o preenchimento do link.
const MEETING_PROVIDERS = [
  {
    value: 'TEAMS',
    label: 'Microsoft Teams',
    placeholder: 'https://teams.microsoft.com/l/meetup-join/…',
  },
  { value: 'ZOOM', label: 'Zoom', placeholder: 'https://zoom.us/j/…' },
  { value: 'JITSI', label: 'Jitsi', placeholder: 'https://meet.jit.si/…' },
];
const MEETING_ITEMS = MEETING_PROVIDERS.map(({ value, label }) => ({
  value,
  label,
}));
function providerOf(url: string): string {
  if (/teams\.(microsoft|live)\.com/i.test(url)) return 'TEAMS';
  if (/zoom\.us/i.test(url)) return 'ZOOM';
  if (/jit\.si|jitsi/i.test(url)) return 'JITSI';
  return '';
}
function jitsiLink(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 30);
  const rand = Math.random().toString(36).slice(2, 8);
  return `https://meet.jit.si/Innova${slug}${rand}`;
}

// Sentinela do Select "Departamento": evento sem departamento dono (todos).
const ALL_DEPARTMENTS = 'ALL';

interface EventForm {
  title: string;
  code: string;
  description: string;
  objective: string;
  type: EventType;
  category: string;
  responsible: DirectoryUser | null;
  departmentId: string;
  bannerUrl: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  modalidade: EventModalidade;
  location: string;
  address: string;
  room: string;
  meetingUrl: string;
  maxCapacity: string;
  mandatory: boolean;
  registrationStartAt: string;
  registrationEndAt: string;
  waitlistEnabled: boolean;
  requiresApproval: boolean;
  targetAudience: string;
  visibility: EventVisibility;
  allowGuest: boolean;
  certificateEnabled: boolean;
  evaluationEnabled: boolean;
  checkinEnabled: boolean;
  notificationsEnabled: boolean;
}

const INITIAL_FORM: EventForm = {
  title: '',
  code: '',
  description: '',
  objective: '',
  type: 'TRAINING',
  category: '',
  responsible: null,
  departmentId: '',
  bannerUrl: null,
  startAt: '',
  endAt: '',
  timezone: 'Africa/Luanda',
  modalidade: 'ONLINE',
  location: '',
  address: '',
  room: '',
  meetingUrl: '',
  maxCapacity: '50',
  mandatory: false,
  registrationStartAt: '',
  registrationEndAt: '',
  waitlistEnabled: true,
  requiresApproval: false,
  targetAudience: '',
  visibility: 'INTERNAL',
  allowGuest: false,
  certificateEnabled: false,
  evaluationEnabled: true,
  checkinEnabled: true,
  notificationsEnabled: true,
};

export function CreateEventModal({ onClose }: CreateEventModalProps) {
  const notify = useToast();

  const { values, set } = useFormState(INITIAL_FORM);
  // Só leitura: a lógica e o JSX abaixo continuam a usar os nomes soltos; as
  // escritas passam por set('campo', valor).
  const {
    title,
    code,
    description,
    objective,
    type,
    category,
    responsible,
    departmentId,
    bannerUrl,
    startAt,
    endAt,
    timezone,
    modalidade,
    location,
    address,
    room,
    meetingUrl,
    maxCapacity,
    mandatory,
    registrationStartAt,
    registrationEndAt,
    waitlistEnabled,
    requiresApproval,
    targetAudience,
    visibility,
    allowGuest,
    certificateEnabled,
    evaluationEnabled,
    checkinEnabled,
    notificationsEnabled,
  } = values;

  const [submitError, setSubmitError] = useState('');
  const [objectiveManual, setObjectiveManual] = useState(false);
  const [meetingProvider, setMeetingProvider] = useState('');
  const provider = meetingProvider || providerOf(meetingUrl);

  const { options: departmentOptions, loading: departmentsLoading } =
    useDepartmentOptions();

  const capacityNum = Number(maxCapacity);
  const datesOk =
    startAt.length > 0 &&
    endAt.length > 0 &&
    new Date(endAt).getTime() > new Date(startAt).getTime();
  const canSubmit =
    title.trim().length > 0 &&
    datesOk &&
    Number.isFinite(capacityNum) &&
    capacityNum >= 1;

  const createEvent = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/events', body),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () => {
        notify({
          title: 'Evento criado como rascunho',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao criar o evento. Tente novamente.'),
    },
  );
  const loading = createEvent.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setSubmitError('Datas inválidas.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setSubmitError('A data de fim tem de ser depois da data de início.');
      return;
    }
    setSubmitError('');

    const str = (v: string) => (v.trim() ? v.trim() : undefined);
    const iso = (v: string) => (v ? new Date(v).toISOString() : undefined);

    createEvent.mutate({
      title: title.trim(),
      type,
      modalidade,
      visibility,
      timezone: timezone.trim() || 'Africa/Luanda',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      maxCapacity: Math.trunc(capacityNum),
      waitlistEnabled,
      requiresApproval,
      allowGuest,
      certificateEnabled,
      evaluationEnabled,
      checkinEnabled,
      notificationsEnabled,
      mandatory,
      ...(str(code) ? { code: str(code) } : {}),
      ...(str(description) ? { description: str(description) } : {}),
      ...(str(objective) ? { objective: str(objective) } : {}),
      ...(str(category) ? { category: str(category) } : {}),
      ...(str(location) ? { location: str(location) } : {}),
      ...(str(address) ? { address: str(address) } : {}),
      ...(str(room) ? { room: str(room) } : {}),
      ...(str(meetingUrl) ? { meetingUrl: str(meetingUrl) } : {}),
      ...(str(targetAudience) ? { targetAudience: str(targetAudience) } : {}),
      ...(iso(registrationStartAt)
        ? { registrationStartAt: iso(registrationStartAt) }
        : {}),
      ...(iso(registrationEndAt)
        ? { registrationEndAt: iso(registrationEndAt) }
        : {}),
      ...(responsible ? { responsibleId: responsible.id } : {}),
      ...(departmentId && departmentId !== ALL_DEPARTMENTS
        ? { departmentId: Number(departmentId) }
        : {}),
      ...(bannerUrl ? { bannerUrl } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Criar evento"
        description="O evento fica como rascunho até ser publicado."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {/* Informações gerais */}
          <section className="space-y-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Informações gerais
            </h3>

            <FormField
              label="Imagem do evento"
              htmlFor="ev-banner"
              hint="Opcional — aparece no topo do cartão do evento."
            >
              <CourseImageField
                value={bannerUrl}
                onChange={(v) => set('bannerUrl', v)}
                alt="Pré-visualização da imagem do evento"
              />
            </FormField>

            <FormField label="Nome *" htmlFor="ev-title">
              <Input
                id="ev-title"
                value={title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex.: Workshop de Inovação Q1"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Código"
                htmlFor="ev-code"
                hint="Opcional — código interno do evento."
              >
                <Input
                  id="ev-code"
                  value={code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="Ex.: EVT-2026-001"
                />
              </FormField>

              <FormField
                label="Categoria"
                htmlFor="ev-category"
                hint="Opcional."
              >
                <Select
                  items={withCurrent(CATEGORY_ITEMS, category)}
                  value={category}
                  onValueChange={(v) => set('category', v)}
                  placeholder="Seleciona…"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Tipo *" htmlFor="ev-type">
                <Select
                  items={TYPE_ITEMS}
                  value={type}
                  onValueChange={(v) => set('type', v as EventType)}
                />
              </FormField>

              <FormField
                label="Departamento"
                htmlFor="ev-department"
                hint="Opcional — departamento dono do evento."
              >
                <Select
                  items={[
                    { value: ALL_DEPARTMENTS, label: 'Todos os departamentos' },
                    ...departmentOptions,
                  ]}
                  value={departmentId}
                  onValueChange={(v) => set('departmentId', v)}
                  placeholder={
                    departmentsLoading ? 'A carregar…' : 'Seleciona…'
                  }
                />
              </FormField>
            </div>

            <DepartmentUserPicker
              label="Responsável"
              htmlFor="ev-responsible"
              value={responsible}
              onChange={(v) => set('responsible', v)}
            />

            <FormField label="Objetivo" htmlFor="ev-objective" hint="Opcional.">
              <Select
                items={OBJECTIVE_ITEMS}
                value={objectiveManual ? OTHER_VALUE : objective}
                onValueChange={(v) => {
                  if (v === OTHER_VALUE) {
                    setObjectiveManual(true);
                    if (OBJECTIVE_LABELS.includes(objective))
                      set('objective', '');
                  } else {
                    setObjectiveManual(false);
                    set('objective', v);
                  }
                }}
                placeholder="Seleciona…"
              />
              {objectiveManual && (
                <Textarea
                  id="ev-objective"
                  rows={2}
                  className="mt-3"
                  value={objective}
                  onChange={(e) => set('objective', e.target.value)}
                  placeholder="Escreve o objetivo do evento…"
                />
              )}
            </FormField>

            <FormField
              label="Descrição"
              htmlFor="ev-description"
              hint="Opcional."
            >
              <Textarea
                id="ev-description"
                rows={3}
                value={description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Agenda, oradores, pré-requisitos…"
              />
            </FormField>
          </section>

          {/* Data & horário */}
          <section className="space-y-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Data & horário
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Início *" htmlFor="ev-start">
                <Input
                  id="ev-start"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => set('startAt', e.target.value)}
                />
              </FormField>

              <FormField label="Fim *" htmlFor="ev-end">
                <Input
                  id="ev-end"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => set('endAt', e.target.value)}
                />
              </FormField>
            </div>

            <FormField
              label="Fuso horário"
              htmlFor="ev-timezone"
              hint="Nome IANA. Ex.: Africa/Luanda, Europe/Lisbon."
            >
              <Input
                id="ev-timezone"
                value={timezone}
                onChange={(e) => set('timezone', e.target.value)}
                placeholder="Africa/Luanda"
              />
            </FormField>
          </section>

          {/* Local */}
          <section className="space-y-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Local
            </h3>

            <FormField label="Modalidade *" htmlFor="ev-modalidade">
              <Select
                items={MODALITY_ITEMS}
                value={modalidade}
                onValueChange={(v) => set('modalidade', v as EventModalidade)}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Local"
                htmlFor="ev-location"
                hint="Opcional — nome do local para eventos presenciais."
              >
                <Input
                  id="ev-location"
                  value={location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Ex.: Auditório, Piso 3"
                />
              </FormField>

              <FormField label="Sala" htmlFor="ev-room" hint="Opcional.">
                <Input
                  id="ev-room"
                  value={room}
                  onChange={(e) => set('room', e.target.value)}
                  placeholder="Ex.: Sala 2A"
                />
              </FormField>
            </div>

            <FormField label="Endereço" htmlFor="ev-address" hint="Opcional.">
              <Input
                id="ev-address"
                value={address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Morada completa"
              />
            </FormField>

            <FormField
              label="Link da reunião"
              htmlFor="ev-meeting"
              hint="Opcional — escolhe a plataforma e cola o link (Jitsi: o link é gerado)."
            >
              <Select
                items={[
                  { value: '', label: 'Nenhuma (opcional)' },
                  ...MEETING_ITEMS,
                ]}
                value={provider}
                onValueChange={(v) => {
                  setMeetingProvider(v);
                  if (v === 'JITSI') {
                    if (!meetingUrl || providerOf(meetingUrl) !== 'JITSI')
                      set('meetingUrl', jitsiLink(title));
                  } else if (providerOf(meetingUrl) === 'JITSI') {
                    set('meetingUrl', '');
                  }
                }}
                placeholder="Plataforma…"
              />
              {provider && (
                <Input
                  id="ev-meeting"
                  className="mt-3"
                  value={meetingUrl}
                  onChange={(e) => set('meetingUrl', e.target.value)}
                  placeholder={
                    MEETING_PROVIDERS.find((m) => m.value === provider)
                      ?.placeholder ?? 'https://…'
                  }
                />
              )}
            </FormField>

            <FormField label="Capacidade máxima *" htmlFor="ev-capacity">
              <Input
                id="ev-capacity"
                type="number"
                min={1}
                value={maxCapacity}
                onChange={(e) => set('maxCapacity', e.target.value)}
              />
            </FormField>
          </section>

          {/* Inscrições */}
          <section className="space-y-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Inscrições
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Início das inscrições"
                htmlFor="ev-reg-start"
                hint="Opcional."
              >
                <Input
                  id="ev-reg-start"
                  type="datetime-local"
                  value={registrationStartAt}
                  onChange={(e) => set('registrationStartAt', e.target.value)}
                />
              </FormField>

              <FormField
                label="Fim das inscrições"
                htmlFor="ev-reg-end"
                hint="Opcional."
              >
                <Input
                  id="ev-reg-end"
                  type="datetime-local"
                  value={registrationEndAt}
                  onChange={(e) => set('registrationEndAt', e.target.value)}
                />
              </FormField>
            </div>

            <FormField
              label="Público-alvo"
              htmlFor="ev-target-audience"
              hint="Opcional."
            >
              <Select
                items={withCurrent(AUDIENCE_ITEMS, targetAudience)}
                value={targetAudience}
                onValueChange={(v) => set('targetAudience', v)}
                placeholder="Seleciona…"
              />
            </FormField>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={mandatory}
                  onChange={(e) => set('mandatory', e.target.checked)}
                  size="sm"
                />
                Inscrição obrigatória
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={waitlistEnabled}
                  onChange={(e) => set('waitlistEnabled', e.target.checked)}
                  size="sm"
                />
                Lista de espera
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={requiresApproval}
                  onChange={(e) => set('requiresApproval', e.target.checked)}
                  size="sm"
                />
                Aprovação de inscrição
              </label>
            </div>
          </section>

          {/* Configurações */}
          <section className="space-y-4">
            <h3 className="m-0 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Configurações
            </h3>

            <FormField
              label="Visibilidade"
              htmlFor="ev-visibility"
              hint="Quem pode ver e inscrever-se no evento."
            >
              <Select
                items={VISIBILITY_ITEMS}
                value={visibility}
                onValueChange={(v) => set('visibility', v as EventVisibility)}
              />
            </FormField>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={allowGuest}
                  onChange={(e) => set('allowGuest', e.target.checked)}
                  size="sm"
                />
                Permitir acompanhante
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={certificateEnabled}
                  onChange={(e) => set('certificateEnabled', e.target.checked)}
                  size="sm"
                />
                Certificado
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={evaluationEnabled}
                  onChange={(e) => set('evaluationEnabled', e.target.checked)}
                  size="sm"
                />
                Avaliação
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={checkinEnabled}
                  onChange={(e) => set('checkinEnabled', e.target.checked)}
                  size="sm"
                />
                Check-in
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <Checkbox
                  checked={notificationsEnabled}
                  onChange={(e) =>
                    set('notificationsEnabled', e.target.checked)
                  }
                  size="sm"
                />
                Notificações
              </label>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar evento
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
