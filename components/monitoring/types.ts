// components/monitoring/types.ts

export interface Indicator {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  baseline: number | null;
  target: number | null;
  frequency: string;
  category: string | null;
  _count?: { records: number };
}
