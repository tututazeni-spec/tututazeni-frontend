// components/settings/styles.ts
// Metadados de navegação do módulo de definições (dados, não estilos).
// `adminOnly`: separadores de configuração da organização (ROLE ADMIN no
// docs/modulo_settings.md) — escondidos para os restantes utilizadores.

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
    label: 'Visão Geral',
    hint: 'Resumo da organização',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    key: 'permissoes',
    label: 'Permissões',
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
    label: 'Segurança',
    hint: 'Palavra-passe e sessões',
    icon: Lock,
  },
  {
    key: 'notificacoes',
    label: 'Notificações',
    hint: 'Canais da organização',
    icon: Bell,
    adminOnly: true,
  },
  {
    key: 'integracoes',
    label: 'Integrações',
    hint: 'Sistemas ligados',
    icon: Plug,
    adminOnly: true,
  },
  {
    key: 'certificados',
    label: 'Certificados',
    hint: 'Modelos e emissão',
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
    label: 'Licença e Módulos',
    hint: 'Plano e módulos',
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    key: 'auditoria',
    label: 'Auditoria e Dados',
    hint: 'Retenção e registos',
    icon: ScrollText,
    adminOnly: true,
  },
  {
    key: 'autenticacao',
    label: 'Autenticação / SSO',
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
    hint: 'Cópias de segurança',
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
