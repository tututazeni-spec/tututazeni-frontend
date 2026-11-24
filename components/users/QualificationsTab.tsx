// components/users/QualificationsTab.tsx
// Separador "Qualificações" do perfil do colaborador: habilitações
// académicas, idiomas, certificações/licenças externas e experiência
// profissional anterior. Alimenta o Simulador de Carreira (requisitos por
// cargo). Endpoints: /users/:id/{qualifications,languages,certifications,experience}.

'use client';

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  Briefcase,
  Languages,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ACADEMIC_LEVEL_LABEL,
  CEFR_LEVELS,
  CEFR_LEVEL_LABEL,
} from '@/components/career/types';
import { ChoiceOrManualField } from '@/components/departments/PositionFormFields';
import {
  ACADEMIC_COURSE_OPTIONS,
  LANGUAGE_OPTIONS,
} from '@/components/departments/positionCatalog';

interface QualificationRow {
  id: number;
  degree: string;
  course: string;
  institution: string | null;
  year: number | null;
}
interface LanguageRow {
  id: number;
  language: string;
  level: string;
}
interface CertificationRow {
  id: number;
  name: string;
  issuer: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
}
interface PriorExperienceRow {
  id: number;
  company: string;
  role: string;
  years: number;
}
interface QualificationsProfile {
  qualifications: QualificationRow[];
  priorExperiences: PriorExperienceRow[];
  languages: LanguageRow[];
  certifications: CertificationRow[];
  priorExperienceYears: number | null; // null = nunca preenchido
}

type Block =
  'qualification' | 'language' | 'certification' | 'experience' | null;

const DEGREE_ITEMS = Object.entries(ACADEMIC_LEVEL_LABEL).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
const CEFR_ITEMS = CEFR_LEVELS.map((l) => ({
  value: l,
  label: `${l} — ${CEFR_LEVEL_LABEL[l]}`,
}));

const card =
  'overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_8px_30px_rgba(11,61,145,0.10)]';
const cardHead =
  'flex items-center justify-between gap-2.5 bg-brand-dark px-5 py-3 text-white';
const row =
  'flex items-center justify-between gap-3 rounded-card border border-brand-line bg-brand-soft/50 px-3 py-2';
const trash =
  'inline-flex h-7 w-7 items-center justify-center rounded-control text-brand/60 hover:bg-surface hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50';
const headBtn =
  'inline-flex h-8 items-center gap-1.5 rounded-control bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

interface RecordBarProps {
  icon: LucideIcon;
  title: string;
  detail: string;
  badge?: ReactNode;
  removeLabel: string;
  onRemove: () => void;
}

// Linha de um registo adicionado (habilitação, experiência, idioma,
// certificação): barra clara com título e detalhe à esquerda e bloco vermelho
// "Remover" à direita (desenho de "titulo do video.jpeg").
function RecordBar({
  icon: Icon,
  title,
  detail,
  badge,
  removeLabel,
  onRemove,
}: RecordBarProps) {
  return (
    <div className="relative flex h-9 items-stretch overflow-hidden rounded-card border border-brand-line bg-gradient-to-r from-surface to-brand-soft/60 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
        <Icon
          size={20}
          strokeWidth={1.75}
          className="shrink-0 text-brand"
          aria-hidden
        />
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="truncate font-body text-sm font-bold text-brand">
            {title}
          </span>
          {detail && (
            <span className="font-body text-xs text-brand">• {detail}</span>
          )}
          {badge}
        </div>
      </div>
      <div className="flex shrink-0 items-center bg-gradient-to-br from-[#EF4444] to-[#DC2626] pl-7 pr-3 [clip-path:polygon(14px_0,100%_0,100%_100%,0_100%)]">
        <button
          type="button"
          aria-label={removeLabel}
          className="inline-flex h-6 items-center gap-1.5 rounded-control border border-white/40 bg-white/10 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          onClick={onRemove}
        >
          <Trash2 size={14} strokeWidth={1.75} /> Remover
        </button>
      </div>
    </div>
  );
}

export function QualificationsTab({ userId }: { userId: number }) {
  const notify = useToast();
  const confirm = useConfirm();
  const [adding, setAdding] = useState<Block>(null);
  const [degree, setDegree] = useState('');
  const [course, setCourse] = useState('');
  const [institution, setInstitution] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState('');
  const [cefr, setCefr] = useState('');
  const [certName, setCertName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [company, setCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expYears, setExpYears] = useState('');

  const { data, isLoading, isError } = useApiQuery<QualificationsProfile>(
    queryKeys.users.qualifications(userId),
    `/users/${userId}/qualifications`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.users.qualifications(userId)];
  const close = () => {
    setAdding(null);
    setDegree('');
    setCourse('');
    setInstitution('');
    setYear('');
    setLanguage('');
    setCefr('');
    setCertName('');
    setIssuer('');
    setIssuedAt('');
    setExpiresAt('');
    setCompany('');
    setExpRole('');
    setExpYears('');
  };
  const onError = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const addQualification = useApiMutation(
    () =>
      apiClient.post(`/users/${userId}/qualifications`, {
        degree,
        course: course.trim(),
        ...(institution.trim() ? { institution: institution.trim() } : {}),
        ...(year ? { year: Number(year) } : {}),
      }),
    { invalidateKeys, onSuccess: close, onError },
  );
  const addLanguage = useApiMutation(
    () =>
      apiClient.post(`/users/${userId}/languages`, {
        language: language.trim(),
        level: cefr,
      }),
    { invalidateKeys, onSuccess: close, onError },
  );
  const addCertification = useApiMutation(
    () =>
      apiClient.post(`/users/${userId}/certifications`, {
        name: certName.trim(),
        ...(issuer.trim() ? { issuer: issuer.trim() } : {}),
        ...(issuedAt ? { issuedAt } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      }),
    { invalidateKeys, onSuccess: close, onError },
  );
  const removeItem = useApiMutation(
    (path: string) => apiClient.delete(`/users/${userId}/${path}`),
    { invalidateKeys, onError },
  );
  const addExperience = useApiMutation(
    () =>
      apiClient.post(`/users/${userId}/prior-experiences`, {
        company: company.trim(),
        role: expRole.trim(),
        years: Number(expYears),
      }),
    { invalidateKeys, onSuccess: close, onError },
  );

  const remove = async (label: string, path: string) => {
    const ok = await confirm({
      title: 'Remover registo',
      message: `Tem a certeza que quer remover "${label}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) removeItem.mutate(path);
  };

  // O backend só deixa o próprio e ADMIN/RH ver estes dados (404 para os restantes,
  // p.ex. GESTOR/LIDER a abrir o perfil de um subordinado).
  if (isError) {
    return (
      <EmptyState
        title="Sem acesso às qualificações"
        description="Estas informações só são visíveis ao próprio colaborador e a RH/Administração."
      />
    );
  }
  if (isLoading || !data) return <Skeleton rows={4} />;

  const isExpired = (iso: string | null) =>
    iso !== null && new Date(iso).getTime() < Date.now();

  return (
    <div className="space-y-5">
      {/* Habilitações */}
      <section className={card}>
        <div className={cardHead}>
          <span className="flex items-center gap-2.5">
            <BookOpen size={18} strokeWidth={1.75} />
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
              Habilitações académicas
            </h3>
          </span>
          {adding !== 'qualification' && (
            <button
              type="button"
              className={headBtn}
              onClick={() => setAdding('qualification')}
            >
              <Plus size={14} strokeWidth={1.75} /> Adicionar
            </button>
          )}
        </div>
        <div className="space-y-1.5 p-5">
          {data.qualifications.length === 0 && adding !== 'qualification' && (
            <EmptyState variant="inline" title="Sem habilitações registadas" />
          )}
          {data.qualifications.map((q) => (
            <RecordBar
              key={q.id}
              icon={BookOpen}
              title={q.course}
              detail={[
                ACADEMIC_LEVEL_LABEL[q.degree] ?? q.degree,
                q.institution,
                q.year,
              ]
                .filter(Boolean)
                .join(' · ')}
              removeLabel={`Remover ${q.course}`}
              onRemove={() => remove(q.course, `qualifications/${q.id}`)}
            />
          ))}
          {adding === 'qualification' && (
            <div className="space-y-2 rounded-card border border-brand-line p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select
                  items={DEGREE_ITEMS}
                  value={degree}
                  onValueChange={setDegree}
                  placeholder="Grau"
                />
                <ChoiceOrManualField
                  id="qualification-course"
                  options={ACADEMIC_COURSE_OPTIONS}
                  value={course}
                  onChange={setCourse}
                  placeholder="Seleccionar curso…"
                  manualPlaceholder="Curso (escrever manualmente)"
                  maxLength={120}
                />
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Instituição (opcional)"
                  className="w-full"
                />
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Ano de conclusão (opcional)"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" intent="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!degree || course.trim().length < 2}
                  loading={addQualification.isPending}
                  onClick={() => addQualification.mutate(undefined)}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Experiência anterior */}
      <section className={card}>
        <div className={cardHead}>
          <span className="flex items-center gap-2.5">
            <Briefcase size={18} strokeWidth={1.75} />
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
              Experiência profissional anterior
            </h3>
          </span>
          {adding !== 'experience' && (
            <button
              type="button"
              className={headBtn}
              onClick={() => setAdding('experience')}
            >
              <Plus size={14} strokeWidth={1.75} /> Adicionar
            </button>
          )}
        </div>
        <div className="space-y-1.5 p-5">
          {data.priorExperiences.length === 0 && adding !== 'experience' && (
            <EmptyState
              variant="inline"
              title={
                data.priorExperienceYears === null
                  ? 'Sem experiência anterior registada'
                  : `${data.priorExperienceYears} anos registados, sem detalhe de empresa e função`
              }
            />
          )}
          {data.priorExperiences.map((x) => (
            <RecordBar
              key={x.id}
              icon={Briefcase}
              title={x.role}
              detail={`${x.company} · ${x.years} ${x.years === 1 ? 'ano' : 'anos'} antes de entrar na empresa`}
              removeLabel={`Remover ${x.role} em ${x.company}`}
              onRemove={() =>
                remove(`${x.role} — ${x.company}`, `prior-experiences/${x.id}`)
              }
            />
          ))}
          {data.priorExperiences.length > 0 &&
            data.priorExperienceYears !== null && (
              <p className="pt-1 font-body text-xs text-brand/70">
                Total: {data.priorExperienceYears} anos antes de entrar na
                empresa
              </p>
            )}
          {adding === 'experience' && (
            <div className="space-y-2 rounded-card border border-brand-line p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Empresa anterior"
                  maxLength={200}
                  className="w-full"
                />
                <Input
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  placeholder="Função"
                  maxLength={200}
                  className="w-full"
                />
                <Input
                  type="number"
                  min={0}
                  max={60}
                  step="0.5"
                  value={expYears}
                  onChange={(e) => setExpYears(e.target.value)}
                  placeholder="Anos antes de entrar na empresa"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" intent="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={
                    company.trim().length < 2 ||
                    expRole.trim().length < 2 ||
                    expYears === '' ||
                    Number(expYears) < 0 ||
                    Number(expYears) > 60
                  }
                  loading={addExperience.isPending}
                  onClick={() => addExperience.mutate(undefined)}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Idiomas */}
      <section className={card}>
        <div className={cardHead}>
          <span className="flex items-center gap-2.5">
            <Languages size={18} strokeWidth={1.75} />
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
              Idiomas
            </h3>
          </span>
          {adding !== 'language' && (
            <button
              type="button"
              className={headBtn}
              onClick={() => setAdding('language')}
            >
              <Plus size={14} strokeWidth={1.75} /> Adicionar
            </button>
          )}
        </div>
        <div className="space-y-1.5 p-5">
          {data.languages.length === 0 && adding !== 'language' && (
            <EmptyState variant="inline" title="Sem idiomas registados" />
          )}
          {data.languages.map((l) => (
            <RecordBar
              key={l.id}
              icon={Languages}
              title={l.language}
              detail={
                CEFR_LEVEL_LABEL[l.level as keyof typeof CEFR_LEVEL_LABEL]
                  ? `${l.level} — ${CEFR_LEVEL_LABEL[l.level as keyof typeof CEFR_LEVEL_LABEL]}`
                  : l.level
              }
              removeLabel={`Remover ${l.language}`}
              onRemove={() => remove(l.language, `languages/${l.id}`)}
            />
          ))}
          {adding === 'language' && (
            <div className="space-y-2 rounded-card border border-brand-line p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <ChoiceOrManualField
                  id="language-name"
                  options={LANGUAGE_OPTIONS}
                  value={language}
                  onChange={setLanguage}
                  placeholder="Seleccionar idioma…"
                  manualPlaceholder="Idioma (escrever manualmente)"
                  maxLength={60}
                />
                <Select
                  items={CEFR_ITEMS}
                  value={cefr}
                  onValueChange={setCefr}
                  placeholder="Nível (A1–C2)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" intent="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={language.trim().length < 2 || !cefr}
                  loading={addLanguage.isPending}
                  onClick={() => addLanguage.mutate(undefined)}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Certificações e licenças */}
      <section className={card}>
        <div className={cardHead}>
          <span className="flex items-center gap-2.5">
            <Award size={18} strokeWidth={1.75} />
            <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
              Certificações e licenças
            </h3>
          </span>
          {adding !== 'certification' && (
            <button
              type="button"
              className={headBtn}
              onClick={() => setAdding('certification')}
            >
              <Plus size={14} strokeWidth={1.75} /> Adicionar
            </button>
          )}
        </div>
        <div className="space-y-1.5 p-5">
          {data.certifications.length === 0 && adding !== 'certification' && (
            <EmptyState variant="inline" title="Sem certificações registadas" />
          )}
          {data.certifications.map((c) => (
            <RecordBar
              key={c.id}
              icon={Award}
              title={c.name}
              detail={`${c.issuer ?? 'Entidade não indicada'}${
                c.expiresAt ? ` · válida até ${formatDate(c.expiresAt)}` : ''
              }`}
              badge={
                isExpired(c.expiresAt) ? (
                  <span className="rounded-pill bg-[#DC2626] px-2 py-0.5 font-body text-xs font-semibold text-white">
                    Expirada
                  </span>
                ) : undefined
              }
              removeLabel={`Remover ${c.name}`}
              onRemove={() => remove(c.name, `certifications/${c.id}`)}
            />
          ))}
          {adding === 'certification' && (
            <div className="space-y-2 rounded-card border border-brand-line p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="Certificação (ex.: AWS Cloud)"
                  className="w-full"
                />
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Entidade emissora (opcional)"
                  className="w-full"
                />
                <Input
                  type="date"
                  value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)}
                  aria-label="Data de emissão"
                  className="w-full"
                />
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  aria-label="Validade"
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" intent="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={certName.trim().length < 2}
                  loading={addCertification.isPending}
                  onClick={() => addCertification.mutate(undefined)}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
