// hooks/useCreateUserForm.ts
// Estado, pickers e submissão do formulário «Novo Utilizador»
// (docs/modulo_users.md Ponto 2): valores e validação, fotografia, verificador
// de email do tenant (sugestão + email em uso), gestor directo, catálogos
// dos pickers e POST /users. Extraído de components/users/CreateUserView.tsx.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { apiClient } from '@/lib/apiClient';
import { resizeImageToDataUrl } from '@/lib/image';
import { queryKeys } from '@/lib/queryKeys';
import {
  email as emailValidator,
  required as requiredRule,
} from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { useDebounce } from './useDebounce';
import { useFormValidation } from './useFormValidation';
import {
  useCompetencyOptions,
  useCourseOptions,
  useDepartmentOptions,
  useDirectoryUsers,
  useLearningPathOptions,
  usePermissionOptions,
  usePositionOptions,
  useRoleOptions,
  useUnitOptions,
} from '@/components/users/createUserData';
import {
  INITIAL_USER_FORM,
  buildCreateUserPayload,
  buildUpdateUserPayload,
  canCheckEmail,
  emailHint,
  emailViolation,
  isEmailTaken,
  isPhotoTooLarge,
  shouldApplyEmailSuggestion,
  shouldSearchManagers,
  userToFormValues,
  type EmailCheck,
  type StringKeys,
  type UserFormValues,
} from '@/components/users/createUser/logic';
import type { DirectoryUser, User } from '@/components/users/types';

/** Pesquisa + escolha de um colaborador no diretório interno. */
function useDirectoryPicker(initial: DirectoryUser | null = null) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DirectoryUser | null>(initial);
  const { users: results, loading } = useDirectoryUsers(
    search,
    shouldSearchManagers(selected, search),
  );
  return {
    search,
    setSearch,
    selected,
    results,
    loading,
    pick: (u: DirectoryUser) => {
      setSelected(u);
      setSearch('');
    },
    clear: () => setSelected(null),
  };
}

/**
 * Sem `editing` cria um utilizador (POST /users). Com `editing` o mesmo
 * formulário vem pré-preenchido e grava só o que mudou (PUT /users/:id).
 */
export function useCreateUserForm(onCreated: () => void, editing?: User) {
  const notify = useToast();
  const initialValues = useMemo(
    () => (editing ? userToFormValues(editing) : INITIAL_USER_FORM),
    // O formulário parte do utilizador aberto; refetches não o devem repor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editing?.id],
  );
  const initialManager: DirectoryUser | null = editing?.manager
    ? {
        id: editing.manager.id,
        fullName: editing.manager.fullName,
        avatarUrl: editing.manager.avatarUrl,
      }
    : null;
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation<UserFormValues>(initialValues, {
    fullName: [requiredRule()],
    email: [requiredRule(), emailValidator()],
  });

  // ── Fotografia ────────────────────────────────────────────────────────────
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);

  async function onPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar o mesmo ficheiro
    if (!file) return;
    if (isPhotoTooLarge(file.size)) {
      notify({
        title: 'Fotografia demasiado grande (máx. 3 MB)',
        intent: 'danger',
      });
      return;
    }
    setPhotoProcessing(true);
    try {
      setField('avatarUrl', await resizeImageToDataUrl(file));
    } catch {
      notify({
        title: 'Não foi possível processar a fotografia',
        intent: 'danger',
      });
    } finally {
      setPhotoProcessing(false);
    }
  }

  const [submitError, setSubmitError] = useState('');

  // ── Email do tenant: sugere nome.apelido@domínio enquanto não for editado ─
  const [emailEdited, setEmailEdited] = useState(!!editing);
  const debouncedName = useDebounce(form.fullName.trim());
  const debouncedEmail = useDebounce(form.email.trim());
  const { data: emailCheck } = useApiQuery<EmailCheck>(
    queryKeys.users.emailCheck(debouncedName, debouncedEmail),
    '/users/email-check',
    {
      params: { fullName: debouncedName, email: debouncedEmail || undefined },
      enabled: canCheckEmail(debouncedName),
      staleTime: 30_000,
    },
  );
  const suggestion = emailCheck?.suggestion;
  useEffect(() => {
    if (shouldApplyEmailSuggestion(suggestion, emailEdited, form.email)) {
      setField('email', suggestion);
    }
  }, [suggestion, emailEdited, form.email, setField]);

  /** Escrever ou escolher uma alternativa passa o email a edição manual. */
  const changeEmail = (value: string) => {
    setEmailEdited(true);
    setField('email', value);
  };

  /** Handler de <input> de texto para uma chave string do formulário. */
  const handle =
    <K extends StringKeys>(k: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setField(k, e.target.value as UserFormValues[K]);

  // ── Gestor directo, Mentor e RH responsável (pesquisa no diretório) ───────
  // Ligam ao onboarding: o plano de integração usa-os como predefinição.
  const manager = useDirectoryPicker(initialManager);
  const mentor = useDirectoryPicker();
  const hrResponsible = useDirectoryPicker();

  // ── Catálogos dos pickers ─────────────────────────────────────────────────
  const {
    options: departmentOptions,
    orgByDepartment,
    loading: departmentsLoading,
  } = useDepartmentOptions();
  const { options: positionOptions, loading: positionsLoading } =
    usePositionOptions();
  const { options: unitOptions, loading: unitsLoading } = useUnitOptions();
  const { options: roleOptions, loading: rolesLoading } = useRoleOptions();
  const { options: permissionOptions, loading: permissionsLoading } =
    usePermissionOptions();
  const { options: courseOptions, loading: coursesLoading } =
    useCourseOptions();
  const { options: learningPathOptions, loading: learningPathsLoading } =
    useLearningPathOptions();
  const { options: competencyOptions, loading: competenciesLoading } =
    useCompetencyOptions();

  // Unidade e área seguem o departamento escolhido: a lista própria dele vem
  // primeiro, mas qualquer outra unidade/área pode ser escolhida ou escrita.
  const departmentOrg = orgByDepartment[form.departmentId];
  const departmentUnitId = departmentOrg?.unitId
    ? String(departmentOrg.unitId)
    : undefined;
  const unitChoices = departmentUnitId
    ? [
        ...unitOptions
          .filter((u) => u.value === departmentUnitId)
          .map((u) => ({ ...u, label: `${u.label} (do departamento)` })),
        ...unitOptions.filter((u) => u.value !== departmentUnitId),
      ]
    : unitOptions;
  const areaOptions = (departmentOrg?.areas ?? []).map((a) => ({
    value: a,
    label: a,
  }));

  /** Mudar de departamento propõe a unidade e a área dele (editáveis depois). */
  const changeDepartment = (id: string) => {
    setField('departmentId', id);
    const org = orgByDepartment[id];
    if (org?.unitId) setField('unitId', String(org.unitId));
    if (org?.areas[0]) setField('area', org.areas[0]);
  };

  const create = useApiMutation(
    () =>
      editing
        ? apiClient.put(
            `/users/${editing.id}`,
            buildUpdateUserPayload(
              initialValues,
              form,
              manager.selected?.id,
              initialManager?.id,
              mentor.selected?.id,
              hrResponsible.selected?.id,
            ),
          )
        : apiClient.post(
            '/users',
            buildCreateUserPayload(
              form,
              manager.selected?.id,
              mentor.selected?.id,
              hrResponsible.selected?.id,
            ),
          ),
    {
      invalidateKeys: editing
        ? [
            queryKeys.users.lists(),
            queryKeys.users.detail(editing.id),
            queryKeys.users.all,
          ]
        : [queryKeys.users.lists()],
      onSuccess: () => onCreated(),
      onError: (e) => setSubmitError(e.message),
    },
  );

  const submit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });

  const alternatives = emailCheck?.alternatives ?? [];

  return {
    form,
    setField,
    handle,
    /** Erro de validação ou, na falta dele, o da gravação. */
    error: validationError || submitError,
    submit,
    saving: create.isPending,

    // Fotografia
    photoInputRef,
    photoProcessing,
    onPhotoChange,
    openPhotoPicker: () => photoInputRef.current?.click(),
    clearPhoto: () => setField('avatarUrl', ''),

    // Email
    changeEmail,
    emailHint: emailHint(emailCheck),
    emailError: emailViolation(emailCheck, form.email, debouncedEmail),
    // Na edição o próprio email do utilizador aparece como "em uso".
    emailTaken:
      isEmailTaken(emailCheck) && !(editing && form.email === editing.email),
    isEditing: !!editing,
    emailAlternatives: alternatives,

    // Gestor directo
    selectedManager: manager.selected,
    managerSearch: manager.search,
    setManagerSearch: manager.setSearch,
    managerResults: manager.results,
    managersLoading: manager.loading,
    pickManager: manager.pick,
    clearManager: manager.clear,

    // Mentor
    selectedMentor: mentor.selected,
    mentorSearch: mentor.search,
    setMentorSearch: mentor.setSearch,
    mentorResults: mentor.results,
    mentorsLoading: mentor.loading,
    pickMentor: mentor.pick,
    clearMentor: mentor.clear,

    // RH responsável
    selectedHr: hrResponsible.selected,
    hrSearch: hrResponsible.search,
    setHrSearch: hrResponsible.setSearch,
    hrResults: hrResponsible.results,
    hrLoading: hrResponsible.loading,
    pickHr: hrResponsible.pick,
    clearHr: hrResponsible.clear,

    // Catálogos
    departmentOptions,
    departmentsLoading,
    positionOptions,
    positionsLoading,
    unitOptions: unitChoices,
    unitsLoading,
    areaOptions,
    changeDepartment,
    roleOptions,
    rolesLoading,
    permissionOptions,
    permissionsLoading,
    courseOptions,
    coursesLoading,
    learningPathOptions,
    learningPathsLoading,
    competencyOptions,
    competenciesLoading,
  };
}

export type CreateUserFormController = ReturnType<typeof useCreateUserForm>;
