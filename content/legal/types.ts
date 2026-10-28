export interface LegalSection {
  title: string;
  paragraphs: readonly string[];
}

export interface LegalDoc {
  /** Tem de coincidir com a versão em vigor no backend (src/legal/legal.versions.ts). */
  version: string;
  /** AAAA-MM-DD da última alteração do texto. */
  updated: string;
  title: string;
  intro: string;
  sections: readonly LegalSection[];
}
