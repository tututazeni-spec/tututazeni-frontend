// components/departments/departmentIcon.ts
// Ícone Lucide sugerido para cada departamento, deduzido do nome.
// Sem correspondência → Building2 (com subdepartamentos) ou Users.

import {
  Banknote,
  Briefcase,
  Building2,
  Cpu,
  FileText,
  GraduationCap,
  Headset,
  HeartPulse,
  Megaphone,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRoundSearch,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const RULES: Array<[RegExp, LucideIcon]> = [
  [/academia|forma[cç]|ensino|treino|learning|educa/, GraduationCap],
  [/recursos humanos|\brh\b|pessoas|talento|recrut/, UserRoundSearch],
  [/financ|contab|tesour|fiscal/, Banknote],
  [/pagament|sal[aá]r|payroll|remunera/, Wallet],
  [/jur[ií]d|legal|contrat|advog/, Scale],
  [/compliance|conformidade|auditoria|seguran|risco|qualidade/, ShieldCheck],
  [/tecnolog|inform[aá]tica|\bti\b|\bit\b|sistemas|software|desenvolv|dados|digital/, Cpu],
  [/marketing|comunica|publicidade|imagem|brand/, Megaphone],
  [/comercial|vendas|neg[oó]cios/, ShoppingCart],
  [/log[ií]stic|transporte|armaz|frota|supply/, Truck],
  [/opera[cç]|produ[cç]|industr|manuten|engenharia|t[eé]cnic/, Wrench],
  [/sa[uú]de|medic|clinic|enferm|hse/, HeartPulse],
  [/apoio|suporte|atendimento|cliente|helpdesk|call/, Headset],
  [/documen|arquivo|secretaria|administra[cç]/, FileText],
  [/direc|direç|ger[eê]ncia|executiv|estrat|planea/, Briefcase],
  [/geral|servi[cç]os|gest[aã]o/, Settings],
];

function normalize(text: string): string {
  return text.toLowerCase();
}

export function departmentIcon(name: string, hasChildren: boolean): LucideIcon {
  const n = normalize(name);
  for (const [re, icon] of RULES) if (re.test(n)) return icon;
  return hasChildren ? Building2 : Users;
}
