// components/roi-impact/WalletStat.tsx
// Carteira ilustrada com dinheiro a sair, independente (sem cartão/caixa à
// volta): rótulo por cima, carteira ao centro e valor por baixo.

type WalletTone = 'blue' | 'green' | 'orange' | 'red';
type WalletMoney = 'bills' | 'coins' | 'stack' | 'mixed' | 'fan';

// Mesmas cores do NavyStatCard (corpo, aba mais escura, texto do valor)
const TONES: Record<WalletTone, { body: string; flap: string }> = {
  blue: { body: '#1877F2', flap: '#0F55B8' },
  green: { body: '#218653', flap: '#155C39' },
  orange: { body: '#E99A16', flap: '#B3740B' },
  red: { body: '#EF4657', flap: '#B52C3B' },
};

function Bill({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`rotate(${r} ${x + 22} ${y + 12})`}>
      <rect x={x} y={y} width="44" height="24" rx="3" fill="#7BC47F" />
      <rect
        x={x + 3}
        y={y + 3}
        width="38"
        height="18"
        rx="2"
        fill="none"
        stroke="#4E9A53"
        strokeWidth="1.5"
      />
      <circle cx={x + 22} cy={y + 12} r="5" fill="#4E9A53" />
    </g>
  );
}

function Coin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="9"
        fill="#F2C230"
        stroke="#C99A0E"
        strokeWidth="1.5"
      />
      <circle
        cx={x}
        cy={y}
        r="5"
        fill="none"
        stroke="#C99A0E"
        strokeWidth="1.2"
      />
    </g>
  );
}

function Money({ kind }: { kind: WalletMoney }) {
  switch (kind) {
    case 'coins':
      return (
        <>
          <Coin x={30} y={26} />
          <Coin x={50} y={18} />
          <Coin x={70} y={26} />
        </>
      );
    case 'stack':
      return (
        <>
          <Bill x={28} y={24} r={0} />
          <Bill x={30} y={16} r={0} />
          <Bill x={32} y={8} r={0} />
        </>
      );
    case 'mixed':
      return (
        <>
          <Bill x={26} y={12} r={-8} />
          <Coin x={78} y={22} />
        </>
      );
    case 'fan':
      return (
        <>
          <Bill x={22} y={14} r={-18} />
          <Bill x={34} y={8} r={0} />
          <Bill x={46} y={14} r={18} />
        </>
      );
    default:
      return (
        <>
          <Bill x={24} y={14} r={-6} />
          <Bill x={44} y={10} r={6} />
        </>
      );
  }
}

export function WalletStat({
  label,
  value,
  tone,
  money,
}: {
  label: string;
  value: string | number;
  tone: WalletTone;
  money: WalletMoney;
}) {
  const t = TONES[tone];
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <h3 className="min-h-[2.5rem] font-body text-sm font-semibold leading-tight text-[#152F59]">
        {label}
      </h3>
      <svg
        width="120"
        height="100"
        viewBox="0 0 120 100"
        role="img"
        aria-label={label}
      >
        <Money kind={money} />
        <rect x="8" y="38" width="100" height="56" rx="10" fill={t.body} />
        <path
          d="M8 48a10 10 0 0 1 10-10h80a10 10 0 0 1 10 10v6H8z"
          fill={t.flap}
        />
        <rect x="78" y="58" width="42" height="24" rx="8" fill={t.flap} />
        <circle cx="92" cy="70" r="4.5" fill="#fff" />
      </svg>
      <p
        className="font-display text-2xl font-bold leading-none"
        style={{ color: t.body }}
      >
        {value}
      </p>
    </div>
  );
}
