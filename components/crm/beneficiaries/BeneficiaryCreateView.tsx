// components/crm/beneficiaries/BeneficiaryCreateView.tsx

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { CREATE_SECTIONS } from './formConfig';
import { FieldRenderer } from './FieldRenderer';

type BeneficiaryForm = Record<string, string>;

interface BeneficiaryCreateViewProps {
  form: BeneficiaryForm;
  setField: (key: string, value: string) => void;
  error: string;
  saving: boolean;
  submit: (e?: { preventDefault?: () => void }) => void;
  onCancel: () => void;
}

export function BeneficiaryCreateView({
  form,
  setField,
  error,
  saving,
  submit,
  onCancel,
}: BeneficiaryCreateViewProps) {
  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={onCancel}
        className="font-body text-sm text-primary hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="font-display text-2xl font-bold text-ink mb-6">
        Novo Beneficiário
      </h1>

      {error && (
        <div className="rounded-card border border-danger bg-danger-subtle p-3 mb-4 text-danger-ink font-body">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {CREATE_SECTIONS.map((section) => (
          <Card key={section.id}>
            <CardBody>
              <h2 className="font-display text-lg font-semibold text-ink mb-4">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((def) => (
                  <FieldRenderer
                    key={def.key}
                    def={def}
                    value={form[def.key] ?? ''}
                    onChange={(v) => setField(def.key, v)}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        ))}

        <p className="font-body text-xs text-ink-muted">
          Benefícios, participações, documentos e consentimentos registam-se no
          detalhe do beneficiário, depois de criado.
        </p>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'A guardar...' : 'Criar Beneficiário'}
          </Button>
          <Button type="button" onClick={onCancel} intent="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
