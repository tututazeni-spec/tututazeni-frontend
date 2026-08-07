import type { NextConfig } from "next";

// Security headers (auditoria A-1, achados F1/F2). HSTS é emitido pela borda
// Caddy — aqui ficam os headers de conteúdo. `script-src 'unsafe-inline'` é a
// concessão aos scripts inline de hidratação do App Router; migrar para nonces
// (via middleware) é iteração futura registada no spec.
//
// `'unsafe-eval'` só em dev: o runtime de Fast Refresh do `next dev` usa
// eval() para aplicar HMR; sem isto o CSP bloqueia o bundle inteiro logo no
// arranque (EvalError silencioso na consola, app fica sem hidratar — toda a
// interactividade morre, incluindo formulários). Produção não usa eval(),
// por isso fica de fora do build final.
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  images: {
    // https apenas — imagens http:// eram mixed content (achado F2).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        // Proxy de dev para o Nest. Em produção o Caddy interceta /api antes
        // de chegar ao Next — este rewrite fica inerte.
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
