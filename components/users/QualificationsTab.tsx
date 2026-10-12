// components/users/QualificationsTab.tsx
// Separador "Qualificações" do perfil do colaborador: habilitações
// académicas, idiomas, certificações/licenças externas e experiência
// profissional anterior. Alimenta o Simulador de Carreira (requisitos por
// cargo). Endpoints: /users/:id/{qualifications,languages,certifications,experience}.

'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ACADEMIC_LEVEL_LABEL, CEFR_LEVELS } from '@/components/career/types';

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
interface QualificationsProfile {
  qualifications: QualificationRow[];
  languages: LanguageRow[];
  certifications: CertificationRow[];
  priorExperienceYears: number | null; // null = nunca preenchido
}

type Block = 'qualification' | 'language' | 'certification' | null;

const DEGREE_ITEMS = Object.entries(ACADEMIC_LEVEL_LABEL).map(
  ([value, label]) => ({
    value,
    label,
  }),
);
const CEFR_ITEMS = CEFR_LEVELS.map((l) => ({ value: l, label: l }));

const card =
  'overflow-hidden rounded-[18px] border border-[#D6E4F5] bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]';
const cardHead =
  'flex items-center justify-between gap-2.5 bg-[#0F1F3D]/60 px-5 py-3 text-white';
const row =
  'flex items-center justify-between gap-3 rounded-xl border border-[#D6E4F5] bg-[#E8F0FE]/50 px-3 py-2';
const trash =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#0F1F3D]/60 hover:bg-white hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50';
const headBtn =
  'inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

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
  const [years, setYears] = useState<string | null>(null);

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
  const saveExperience = useApiMutation(
    (value: number) =>
      apiClient.patch(`/users/${userId}/experience`, {
        priorExperienceYears: value,
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        setYears(null);
        notify({ title: 'Experiência guardada', intent: 'success' });
      },
      onError,
    },
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
            <p className="font-body text-xs text-[#0F1F3D]/50">
              Sem habilitações registadas.
            </p>
          )}
          {data.qualifications.map((q) => (
            <div key={q.id} className={row}>
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-[#0F1F3D]">
                  {q.course}
                </div>
                <div className="font-body text-xs text-[#0F1F3D]/60">
                  {ACADEMIC_LEVEL_LABEL[q.degree] ?? q.degree}
                  {q.institution ? ` · ${q.institution}` : ''}
                  {q.year ? ` · ${q.year}` : ''}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remover ${q.course}`}
                className={trash}
                onClick={() => remove(q.course, `qualifications/${q.id}`)}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
          {adding === 'qualification' && (
            <div className="space-y-2 rounded-xl border border-[#D6E4F5] p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select
                  items={DEGREE_ITEMS}
                  value={degree}
                  onValueChange={setDegree}
                  placeholder="Grau"
                />
                <Input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Curso"
                  className="w-full"
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
        </div>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <Input
            type="number"
            min={0}
            step="0.5"
            value={
              years ??
              (data.priorExperienceYears === null
                ? ''
                : String(data.priorExperienceYears))
            }
            onChange={(e) => setYears(e.target.value)}
            className="w-32"
            aria-label="Anos de experiência anterior"
          />
          <span className="font-body text-sm text-[#0F1F3D]/70">
            anos antes de entrar na empresa
          </span>
          <Button
            size="sm"
            disabled={years === null || years === '' || Number(years) < 0}
            loading={saveExperience.isPending}
            onClick={() => saveExperience.mutate(Number(years))}
          >
            Guardar
          </Button>
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
            <p className="font-body text-xs text-[#0F1F3D]/50">
              Sem idiomas registados.
            </p>
          )}
          {data.languages.map((l) => (
            <div key={l.id} className={row}>
              <div className="font-body text-sm font-medium text-[#0F1F3D]">
                {l.language}
              </div>
              <div className="flex items-center gap-2">
                <Badge intent="info">{l.level}</Badge>
                <button
                  type="button"
                  aria-label={`Remover ${l.language}`}
                  className={trash}
                  onClick={() => remove(l.language, `languages/${l.id}`)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
          {adding === 'language' && (
            <div className="space-y-2 rounded-xl border border-[#D6E4F5] p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Idioma (ex.: Inglês)"
                  className="w-full"
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
            <p className="font-body text-xs text-[#0F1F3D]/50">
              Sem certificações registadas.
            </p>
          )}
          {data.certifications.map((c) => (
            <div key={c.id} className={row}>
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-[#0F1F3D]">
                  {c.name}
                </div>
                <div className="font-body text-xs text-[#0F1F3D]/60">
                  {c.issuer ?? 'Entidade não indicada'}
                  {c.expiresAt
                    ? ` · válida até ${formatDate(c.expiresAt)}`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isExpired(c.expiresAt) && (
                  <Badge intent="danger">Expirada</Badge>
                )}
                <button
                  type="button"
                  aria-label={`Remover ${c.name}`}
                  className={trash}
                  onClick={() => remove(c.name, `certifications/${c.id}`)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          ))}
          {adding === 'certification' && (
            <div className="space-y-2 rounded-xl border border-[#D6E4F5] p-3">
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
