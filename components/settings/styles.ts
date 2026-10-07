// components/settings/styles.ts
// Metadados de navegaÃ§Ã£o do mÃ³dulo de definiÃ§Ãµes (dados, nÃ£o estilos).
// `adminOnly`: separadores de configuraÃ§Ã£o da organizaÃ§Ã£o (ROLE ADMIN no
// docs/modulo_settings.md) â€” escondidos para os restantes utilizadores.

import {
  Archive,
  BadgeCheck,
  Bell,
  FileLock2,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MessageCircle,
  Plug,
  ScrollText,
  Server,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import type { PillTabItem } from '@/components/ui/PillTabs';
import type { Tab } from './types';

export const NAV: Array<
  Omit<PillTabItem, 'id'> & { key: Tab; adminOnly?: boolean }
> = [
  { key: 'perfil', label: 'Perfil', hint: 'Os teus dados', icon: User },
  {
    key: 'visao-geral',
    label: 'VisÃ£o Geral',
    hint: 'Resumo da organizaÃ§Ã£o',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    key: 'permissoes',
    label: 'PermissÃµes',
    hint: 'Acessos e perfis',
    icon: KeyRound,
  },
  {
    key: 'utilizadores',
    label: 'Utilizadores',
    hint: 'Contas e estados',
    icon: Users,
    adminOnly: true,
  },
  {
    key: 'seguranca',
    label: 'SeguranÃ§a',
    hint: 'Palavra-passe e sessÃµes',
    icon: Lock,
  },
  {
    key: 'notificacoes',
    label: 'NotificaÃ§Ãµes',
    hint: 'Canais da organizaÃ§Ã£o',
    icon: Bell,
    adminOnly: true,
  },
  {
    key: 'integracoes',
    label: 'IntegraÃ§Ãµes',
    hint: 'Sistemas ligados',
    icon: Plug,
    adminOnly: true,
  },
  {
    key: 'certificados',
    label: 'Certificados',
    hint: 'Modelos e emissÃ£o',
    icon: BadgeCheck,
    adminOnly: true,
  },
  {
    key: 'privacidade',
    label: 'Privacidade',
    hint: 'LPDP e consentimentos',
    icon: FileLock2,
    adminOnly: true,
  },
  {
    key: 'licenca',
    label: 'LicenÃ§a e MÃ³dulos',
    hint: 'Plano e mÃ³dulos',
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    key: 'auditoria',
    label: 'Auditoria e Dados',
    hint: 'RetenÃ§Ã£o e registos',
    icon: ScrollText,
    adminOnly: true,
  },
  {
    key: 'autenticacao',
    label: 'AutenticaÃ§Ã£o / SSO',
    hint: 'SSO e LDAP',
    icon: KeyRound,
    adminOnly: true,
  },
  {
    key: 'email',
    label: 'Email',
    hint: 'Servidor de envio',
    icon: Mail,
    adminOnly: true,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    hint: 'Meta Business',
    icon: MessageCircle,
    adminOnly: true,
  },
  {
    key: 'backups',
    label: 'Backups',
    hint: 'CÃ³pias de seguranÃ§a',
    icon: Archive,
    adminOnly: true,
  },
  {
    key: 'sistema',
    label: 'Sistema',
    hint: 'Estado da plataforma',
    icon: Server,
    adminOnly: true,
  },
];
