// components/work-declaration/mockData.ts
// Dados mock — página ainda não ligada a um backend real. Extraído
// de app/(platform)/work-declaration/page.tsx.

import type { Declaration, Stats } from './types';

export const MOCK_DECLARATIONS: Declaration[] = [
  {
    id: '1',
    code: 'INNOVA-2025-0041',
    title: 'Declaração de Vínculo Empregatício',
    type: 'employment',
    status: 'signed',
    employeeName: 'Ana Ferreira',
    employeeRole: 'Product Designer',
    department: 'Design',
    createdAt: '2025-04-12',
    issuedAt: '2025-04-13',
    expiresAt: '2025-07-13',
    createdBy: 'Maria Silva (RH)',
  },
  {
    id: '2',
    code: 'INNOVA-2025-0042',
    title: 'Declaração de Participação em Formação',
    type: 'training',
    status: 'issued',
    employeeName: 'Bruno Costa',
    employeeRole: 'Engenheiro de Software',
    department: 'Tecnologia',
    createdAt: '2025-04-15',
    issuedAt: '2025-04-16',
    createdBy: 'Maria Silva (RH)',
  },
  {
    id: '3',
    code: 'INNOVA-2025-0043',
    title: 'Declaração para Fins Bancários',
    type: 'employment',
    status: 'draft',
    employeeName: 'Carla Mendes',
    employeeRole: 'Analista Financeira',
    department: 'Finanças',
    createdAt: '2025-04-22',
    createdBy: 'João Pinto (RH)',
  },
  {
    id: '4',
    code: 'INNOVA-2025-0039',
    title: 'Declaração de Frequência',
    type: 'attendance',
    status: 'expired',
    employeeName: 'Diogo Alves',
    employeeRole: 'Sales Manager',
    department: 'Comercial',
    createdAt: '2025-01-10',
    issuedAt: '2025-01-11',
    expiresAt: '2025-04-11',
    createdBy: 'Maria Silva (RH)',
  },
  {
    id: '5',
    code: 'INNOVA-2025-0044',
    title: 'Declaração de Desempenho',
    type: 'performance',
    status: 'signed',
    employeeName: 'Elena Rocha',
    employeeRole: 'Tech Lead',
    department: 'Tecnologia',
    createdAt: '2025-04-18',
    issuedAt: '2025-04-19',
    expiresAt: '2025-07-19',
    createdBy: 'João Pinto (RH)',
  },
];

export const MOCK_STATS: Stats = {
  total: 44,
  draft: 6,
  issued: 12,
  signed: 22,
  expiredOrRevoked: 4,
};
