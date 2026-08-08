// hooks/usePageTitle.ts
import { useEffect } from 'react';

/**
 * Define o título do separador do browser para esta página ("<title> | INNOVA",
 * mesmo template do root layout). A maioria das páginas da app é um Client
 * Component e não pode exportar `metadata` directamente (só Server Components
 * podem) — este hook é o equivalente possível dentro de Client Components.
 *
 * Achado da auditoria de frontend (secção SEO/usabilidade): sem isto, todas
 * as ~50 rotas mostravam sempre "INNOVA" no separador — indistinguíveis com
 * várias abertas ao mesmo tempo.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | INNOVA`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
