// components/library/types.ts

export interface Item {
  id: string;
  code: string;
  title: string;
  type: string;
  author: string | null;
  views: number;
  downloads: number;
  rating: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: { fullName: string } | null;
}

export interface Rating {
  id: string;
  score: number;
  comment: string | null;
  user?: { fullName: string } | null;
}

export interface ItemDetail {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  fileUrl: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  language: string;
  pages: number | null;
  isbn: string | null;
  categories: string[];
  keywords: string[];
  views: number;
  downloads: number;
  rating: number;
  ratingCount: number;
  isApproved: boolean;
  collection?: { name: string } | null;
  uploadedBy?: { fullName: string } | null;
  comments: Comment[];
  ratings: Rating[];
  _count: { comments: number; ratings: number };
}

export const TYPE_ICONS: Record<string, string> = {
  PDF: '📄',
  EBOOK: '📚',
  VIDEO: '🎬',
  AUDIO: '🎵',
  PRESENTATION: '📊',
  SPREADSHEET: '📈',
  DOCUMENT: '📝',
  IMAGE: '🖼️',
  LINK: '🔗',
  SCORM: '🎓',
  OTHER: '📦',
};

export const TYPE_LABELS: Record<string, string> = {
  PDF: 'PDF',
  EBOOK: 'E-book',
  VIDEO: 'Vídeo',
  AUDIO: 'Áudio',
  PRESENTATION: 'Apresentação',
  SPREADSHEET: 'Folha de cálculo',
  DOCUMENT: 'Documento',
  IMAGE: 'Imagem',
  LINK: 'Link',
  SCORM: 'SCORM',
  OTHER: 'Outro',
};

export interface LibraryItemPayload {
  type: string;
  title: string;
  fileUrl: string;
  language: string;
  subtitle?: string;
  description?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  year?: number;
  pages?: number;
  categories?: string[];
  keywords?: string[];
}
