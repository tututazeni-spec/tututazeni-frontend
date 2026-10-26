export type TopBarTone = 'blue' | 'green' | 'gold' | 'red';

const TONES: { [K in TopBarTone]: { bar: string; text: string } } = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-brand-ink' },
  green: { bar: 'bg-success', text: 'text-success' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-danger', text: 'text-danger' },
};

export interface TopBarCardProps {
  label: string;
  value: string | number;
  tone: TopBarTone;
  icon: React.ReactNode;
}

export function TopBarCard({ label, value, tone, icon }: TopBarCardProps) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-md transition-shadow duration-200 hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5">
        <div className={t.text}>{icon}</div>
        <div
          className={`mt-3 break-words font-data text-3xl font-bold xl:text-4xl ${t.text}`}
        >
          {value}
        </div>
        <div className="mt-1 break-words font-body text-base text-ink">
          {label}
        </div>
      </div>
    </div>
  );
}
