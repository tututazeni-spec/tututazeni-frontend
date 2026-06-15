'use client';

import { installApiFetch } from '../lib/http';

// Instala o patch ao fetch no momento em que o módulo é avaliado no cliente,
// antes de qualquer efeito das páginas correr (os efeitos dos filhos correm
// antes dos do layout, por isso NÃO usamos useEffect aqui).
installApiFetch();

export default function ClientInit() {
  return null;
}
