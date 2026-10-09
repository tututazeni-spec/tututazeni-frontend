export type TopBarTone = 'blue' | 'green' | 'gold' | 'red';

const TONES: { [K in TopBarTone]: { bar: string; text: string } } = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

export function TopBarCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: TopBarTone;
  icon: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5">
        <div className={t.text}>{icon}</div>
        <div className={`mt-3 font-data text-4xl font-bold ${t.text}`}>
          {value}
        </div>
        <div className="mt-1 break-words font-body text-lg text-black">{label}</div>
      </div>
    </div>
  );
}
