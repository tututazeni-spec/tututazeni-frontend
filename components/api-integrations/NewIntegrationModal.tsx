// components/api-integrations/NewIntegrationModal.tsx
// Modal "Nova Integração" — separador Integrações do módulo API Integration.
// Mesmo formulário completo do módulo Escalabilidade (ver
// components/scalability/NewIntegrationModal.tsx) — os dois módulos escrevem
// no mesmo modelo Prisma (IntegrationConfig) mas são serviços/rotas
// distintos (POST /api-integrations aqui, não /scalability/integrations).
//
// Client ID/Client Secret/Token de acesso nunca são guardados em campos
// próprios: o backend combina-os num único blob e encripta antes de
// persistir em IntegrationConfig.credentialsJson (ver
// ApiIntegrationService.buildCredentialsJson). "Testar conexão" chama
// POST /api-integrations/test-connection, que não precisa de a integração
// já existir. tenantId é resolvido no backend (plataforma single-tenant).

'use client';

import { useState } from 'react';
import { Loader2, Plug, Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import type {
  CreateIntegrationPayload,
  IntegrationStatusValue,
  TestConnectionResult,
} from './types';

export interface NewIntegrationModalProps {
  onClose: () => void;
}

const CATEGORY_OPTIONS: SelectItemOption[] = [
  { value: 'ERP', label: 'ERP' },
  { value: 'SSO', label: 'SSO' },
  { value: 'LMS', label: 'LMS' },
  { value: 'COMMUNICATION', label: 'Comunicação' },
  { value: 'HR', label: 'Recursos Humanos' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'PAYROLL', label: 'Folha de Pagamento' },
  { value: 'IDENTITY_ACCESS', label: 'Identidade e Acesso' },
  { value: 'OTHER', label: 'Outros' },
];

const TYPE_OPTIONS: SelectItemOption[] = [
  { value: 'REST_API', label: 'API REST' },
  { value: 'SOAP_API', label: 'API SOAP' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'SFTP', label: 'SFTP' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
  { value: 'LDAP', label: 'LDAP' },
  { value: 'SAML2', label: 'SAML 2.0' },
  { value: 'OPENID_CONNECT', label: 'OpenID Connect' },
  { value: 'DATABASE', label: 'Base de Dados' },
  { value: 'CSV_FILE', label: 'Ficheiro CSV' },
  { value: 'EXCEL_FILE', label: 'Ficheiro Excel' },
  { value: 'OTHER', label: 'Outro' },
];

const AUTH_TYPE_OPTIONS: SelectItemOption[] = [
  { value: 'NONE', label: 'Nenhum' },
  { value: 'API_KEY', label: 'API Key' },
  { value: 'BASIC', label: 'Basic Auth' },
  { value: 'BEARER', label: 'Bearer Token' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
];

const ENVIRONMENT_OPTIONS: SelectItemOption[] = [
  { value: 'PRODUCTION', label: 'Produção' },
  { value: 'STAGING', label: 'Homologação' },
  { value: 'DEVELOPMENT', label: 'Desenvolvimento' },
  { value: 'SANDBOX', label: 'Sandbox' },
];

const DATA_FORMAT_OPTIONS: SelectItemOption[] = [
  { value: 'JSON', label: 'JSON' },
  { value: 'XML', label: 'XML' },
  { value: 'CSV', label: 'CSV' },
  { value: 'EXCEL', label: 'Excel' },
];

const COMMUNICATION_METHOD_OPTIONS: SelectItemOption[] = [
  { value: 'PULL', label: 'Pull' },
  { value: 'PUSH', label: 'Push' },
  { value: 'POLLING', label: 'Polling' },
  { value: 'STREAMING', label: 'Streaming' },
];

const SYNC_FREQUENCY_OPTIONS: SelectItemOption[] = [
  { value: 'REALTIME', label: 'Tempo Real' },
  { value: 'HOURLY', label: 'A cada hora' },
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MANUAL', label: 'Manual' },
];

const SYNC_DIRECTION_OPTIONS: SelectItemOption[] = [
  { value: 'INBOUND', label: 'Entrada (do sistema externo)' },
  { value: 'OUTBOUND', label: 'Saída (para o sistema externo)' },
  { value: 'BIDIRECTIONAL', label: 'Bidirecional' },
];

const STATUS_OPTIONS: { value: IntegrationStatusValue; label: string }[] = [
  { value: 'CONFIGURING', label: 'Em configuração' },
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'INACTIVE', label: 'Inativa' },
  { value: 'SUSPENDED', label: 'Suspensa' },
  { value: 'ERROR', label: 'Com erro' },
];

interface FieldMappingRow {
  source: string;
  target: string;
}

const emptyMappingRow: FieldMappingRow = { source: '', target: '' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function NewIntegrationModal({ onClose }: NewIntegrationModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('REST_API');
  const [category, setCategory] = useState<string | undefined>();
  const [platform, setPlatform] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<string | undefined>('NONE');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [environment, setEnvironment] = useState<string | undefined>('PRODUCTION');
  const [apiVersion, setApiVersion] = useState('');
  const [dataFormat, setDataFormat] = useState<string | undefined>('JSON');
  const [communicationMethod, setCommunicationMethod] = useState<string | undefined>();
  const [syncFrequency, setSyncFrequency] = useState<string | undefined>('DAILY');
  const [syncDirection, setSyncDirection] = useState<string | undefined>();
  const [dataToSync, setDataToSync] = useState('');
  const [mappingRows, setMappingRows] = useState<FieldMappingRow[]>([{ ...emptyMappingRow }]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState('');
  const [timeoutMs, setTimeoutMs] = useState('5000');
  const [maxRetries, setMaxRetries] = useState('3');
  const [retryIntervalMs, setRetryIntervalMs] = useState('1000');
  const [status, setStatus] = useState<IntegrationStatusValue>('CONFIGURING');
  const [activatedAt, setActivatedAt] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [notes, setNotes] = useState('');

  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);

  const createMutation = useApiMutation<unknown, CreateIntegrationPayload>(
    (payload) => apiClient.post('/api-integrations', payload),
    {
      invalidateKeys: [
        queryKeys.apiIntegrations.list(),
        queryKeys.apiIntegrations.stats(),
      ],
    },
  );

  const buildPayload = (): CreateIntegrationPayload => {
    const mapping: Record<string, string> = {};
    for (const row of mappingRows) {
      if (row.source.trim() && row.target.trim()) mapping[row.source.trim()] = row.target.trim();
    }
    return {
      name: name.trim(),
      type: type as CreateIntegrationPayload['type'],
      category: category as CreateIntegrationPayload['category'],
      platform: platform.trim() || undefined,
      endpoint: baseUrl.trim(),
      description: description.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined,
      authType: authType as CreateIntegrationPayload['authType'],
      clientId: clientId.trim() || undefined,
      clientSecret: clientSecret.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
      authUrl: authUrl.trim() || undefined,
      environment: environment as CreateIntegrationPayload['environment'],
      apiVersion: apiVersion.trim() || undefined,
      dataFormat: dataFormat as CreateIntegrationPayload['dataFormat'],
      communicationMethod: communicationMethod as CreateIntegrationPayload['communicationMethod'],
      syncFrequency: syncFrequency as CreateIntegrationPayload['syncFrequency'],
      syncDirection: syncDirection as CreateIntegrationPayload['syncDirection'],
      dataToSync: dataToSync
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      fieldMapping: Object.keys(mapping).length > 0 ? mapping : undefined,
      webhookUrl: webhookUrl.trim() || undefined,
      webhookEvents: webhookEvents
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      timeoutMs: timeoutMs ? Number(timeoutMs) : undefined,
      maxRetries: maxRetries ? Number(maxRetries) : undefined,
      retryIntervalMs: retryIntervalMs ? Number(retryIntervalMs) : undefined,
      status,
      activatedAt: activatedAt || undefined,
      responsibleUserId: responsibleUserId.trim() || undefined,
      active: status === 'ACTIVE',
      notes: notes.trim() || undefined,
    };
  };

  const canSubmit =
    name.trim().length > 0 && !!type && baseUrl.trim().length > 0 && !createMutation.isPending;

  const handleTestConnection = async () => {
    const url = baseUrl.trim();
    if (!url) {
      notify({ title: 'Indica a URL/Endpoint antes de testar', intent: 'info' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await apiClient
      .post<TestConnectionResult>('/api-integrations/test-connection', {
        baseUrl: url,
        authType,
        apiKey: apiKey.trim() || undefined,
        accessToken: accessToken.trim() || undefined,
        clientId: clientId.trim() || undefined,
        clientSecret: clientSecret.trim() || undefined,
        timeoutMs: timeoutMs ? Number(timeoutMs) : undefined,
      })
      .catch((e) => {
        reportError(e, { source: 'NewIntegrationModal.handleTestConnection' });
        return null;
      });
    setTesting(false);
    setTestResult(result);
    if (!result) notify({ title: 'Não foi possível testar a conexão', intent: 'danger' });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate(buildPayload(), {
      onSuccess: () => {
        notify({ title: `Integração "${name.trim()}" criada com sucesso`, intent: 'success' });
        onClose();
      },
      onError: (err) => {
        reportError(err, { source: 'NewIntegrationModal.handleSubmit' });
        notify({ title: 'Não foi possível criar a integração', intent: 'danger' });
      },
    });
  };

  const updateMappingRow = (index: number, field: keyof FieldMappingRow, value: string) => {
    setMappingRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Integração"
        description="Liga a plataforma a um sistema externo (ERP, SSO, LMS, comunicação...)."
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-5 flex flex-col gap-6">
          <Section title="Identificação">
            <FormField label="Nome da integração" htmlFor="ni-name">
              <Input
                id="ni-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: SAP SuccessFactors"
              />
            </FormField>
            <FormField label="Tipo de integração" htmlFor="ni-type">
              <Select items={TYPE_OPTIONS} value={type} onValueChange={setType} />
            </FormField>
            <FormField label="Categoria" htmlFor="ni-category">
              <Select
                items={CATEGORY_OPTIONS}
                value={category}
                onValueChange={setCategory}
                placeholder="Selecionar…"
              />
            </FormField>
            <FormField label="Sistema/Plataforma" htmlFor="ni-platform">
              <Input
                id="ni-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Ex.: SAP, Workday, Moodle…"
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Descrição" htmlFor="ni-description">
                <Textarea
                  id="ni-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>
            </div>
          </Section>

          <Section title="Ligação">
            <div className="sm:col-span-2">
              <FormField
                label="URL/Endpoint"
                htmlFor="ni-baseurl"
                hint="Endpoint principal da integração."
              >
                <Input
                  id="ni-baseurl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.exemplo.com/v1"
                />
              </FormField>
            </div>
            <FormField label="Ambiente" htmlFor="ni-environment">
              <Select
                items={ENVIRONMENT_OPTIONS}
                value={environment}
                onValueChange={setEnvironment}
              />
            </FormField>
            <FormField label="Versão da API" htmlFor="ni-apiversion">
              <Input
                id="ni-apiversion"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                placeholder="Ex.: v2"
              />
            </FormField>
            <FormField label="Formato de dados" htmlFor="ni-dataformat">
              <Select items={DATA_FORMAT_OPTIONS} value={dataFormat} onValueChange={setDataFormat} />
            </FormField>
            <FormField label="Método de comunicação" htmlFor="ni-commethod">
              <Select
                items={COMMUNICATION_METHOD_OPTIONS}
                value={communicationMethod}
                onValueChange={setCommunicationMethod}
                placeholder="Selecionar…"
              />
            </FormField>
          </Section>

          <Section title="Autenticação">
            <FormField label="Método de autenticação" htmlFor="ni-authtype">
              <Select items={AUTH_TYPE_OPTIONS} value={authType} onValueChange={setAuthType} />
            </FormField>
            <FormField label="URL de autenticação" htmlFor="ni-authurl">
              <Input
                id="ni-authurl"
                value={authUrl}
                onChange={(e) => setAuthUrl(e.target.value)}
                placeholder="https://auth.exemplo.com/oauth/token"
              />
            </FormField>
            <FormField label="Client ID" htmlFor="ni-clientid">
              <Input id="ni-clientid" value={clientId} onChange={(e) => setClientId(e.target.value)} />
            </FormField>
            <FormField label="Client Secret" htmlFor="ni-clientsecret">
              <Input
                id="ni-clientsecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </FormField>
            <FormField label="API Key" htmlFor="ni-apikey">
              <Input
                id="ni-apikey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </FormField>
            <FormField label="Token de acesso" htmlFor="ni-token">
              <Input
                id="ni-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </FormField>
            <div className="sm:col-span-2">
              <Button
                intent="secondary"
                size="sm"
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} strokeWidth={1.75} />}
                Testar conexão
              </Button>
              {testResult && (
                <p
                  className={`mt-2 font-body text-xs ${testResult.success ? 'text-success-ink' : 'text-danger-ink'}`}
                >
                  {testResult.message}
                </p>
              )}
            </div>
          </Section>

          <Section title="Sincronização">
            <FormField label="Frequência de sincronização" htmlFor="ni-syncfreq">
              <Select
                items={SYNC_FREQUENCY_OPTIONS}
                value={syncFrequency}
                onValueChange={setSyncFrequency}
              />
            </FormField>
            <FormField label="Direção da sincronização" htmlFor="ni-syncdir">
              <Select
                items={SYNC_DIRECTION_OPTIONS}
                value={syncDirection}
                onValueChange={setSyncDirection}
                placeholder="Selecionar…"
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                label="Dados a sincronizar"
                htmlFor="ni-datasync"
                hint="Separados por vírgula (ex.: users, courses, enrollments)"
              >
                <Input
                  id="ni-datasync"
                  value={dataToSync}
                  onChange={(e) => setDataToSync(e.target.value)}
                  placeholder="users, courses, enrollments"
                />
              </FormField>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              <span className="font-body text-xs font-medium text-ink">Mapeamento de campos</span>
              {mappingRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    aria-label="Campo de origem"
                    value={row.source}
                    onChange={(e) => updateMappingRow(i, 'source', e.target.value)}
                    placeholder="Campo de origem"
                    className="flex-1"
                  />
                  <span className="font-body text-xs text-ink-faint">→</span>
                  <Input
                    aria-label="Campo de destino"
                    value={row.target}
                    onChange={(e) => updateMappingRow(i, 'target', e.target.value)}
                    placeholder="Campo de destino"
                    className="flex-1"
                  />
                  <Button
                    intent="ghost"
                    size="sm"
                    type="button"
                    aria-label="Remover linha"
                    onClick={() => setMappingRows((rows) => rows.filter((_, idx) => idx !== i))}
                    disabled={mappingRows.length === 1}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </Button>
                </div>
              ))}
              <Button
                intent="ghost"
                size="sm"
                type="button"
                className="self-start"
                onClick={() => setMappingRows((rows) => [...rows, { ...emptyMappingRow }])}
              >
                <Plus size={14} strokeWidth={1.75} />
                Adicionar campo
              </Button>
            </div>
            <FormField label="URL de Webhook" htmlFor="ni-webhookurl">
              <Input
                id="ni-webhookurl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://…/webhooks/receiver"
              />
            </FormField>
            <FormField
              label="Eventos/Webhooks"
              htmlFor="ni-webhookevents"
              hint="Separados por vírgula (ex.: course.completed, user.promoted)"
            >
              <Input
                id="ni-webhookevents"
                value={webhookEvents}
                onChange={(e) => setWebhookEvents(e.target.value)}
                placeholder="course.completed, user.promoted"
              />
            </FormField>
          </Section>

          <Section title="Confiabilidade">
            <FormField label="Timeout (ms)" htmlFor="ni-timeout">
              <Input
                id="ni-timeout"
                type="number"
                min={0}
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
              />
            </FormField>
            <FormField label="Número máximo de tentativas" htmlFor="ni-maxretries">
              <Input
                id="ni-maxretries"
                type="number"
                min={0}
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
              />
            </FormField>
            <FormField label="Intervalo entre tentativas (ms)" htmlFor="ni-retryinterval">
              <Input
                id="ni-retryinterval"
                type="number"
                min={0}
                value={retryIntervalMs}
                onChange={(e) => setRetryIntervalMs(e.target.value)}
              />
            </FormField>
          </Section>

          <Section title="Gestão">
            <FormField label="Estado" htmlFor="ni-status">
              <Select
                items={STATUS_OPTIONS}
                value={status}
                onValueChange={(v) => setStatus(v as IntegrationStatusValue)}
              />
            </FormField>
            <FormField label="Data de ativação" htmlFor="ni-activatedat">
              <Input
                id="ni-activatedat"
                type="date"
                value={activatedAt}
                onChange={(e) => setActivatedAt(e.target.value)}
              />
            </FormField>
            <FormField label="Responsável pela integração" htmlFor="ni-responsible">
              <Input
                id="ni-responsible"
                value={responsibleUserId}
                onChange={(e) => setResponsibleUserId(e.target.value)}
                placeholder="ID ou nome do responsável"
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Observações" htmlFor="ni-notes">
                <Textarea
                  id="ni-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormField>
            </div>
          </Section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createMutation.isPending ? 'A criar…' : 'Criar Integração'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
