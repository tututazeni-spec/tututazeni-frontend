// components/executive-reports/deptColor.ts
// Uma cor distinta por departamento (ângulo áureo evita tons vizinhos
// repetidos, mesmo com dezenas de departamentos).
export const deptColor = (i: number) =>
  `hsl(${Math.round((i * 137.508) % 360)} 55% 45%)`;
