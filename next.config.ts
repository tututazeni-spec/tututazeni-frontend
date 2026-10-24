import type { NextConfig } from 'next';

// Security headers estáticos (auditoria A-1). A CSP NÃO está aqui: leva um nonce
// por pedido e por isso é emitida pelo middleware.ts (lib/csp.ts). O HSTS vem da
// borda Caddy.
//
// Câmara/microfone/ecrã são delegados ao Jitsi (aulas ao vivo): com `camera=()`
// o iframe da sala nunca conseguia pedir a câmara.
const JITSI = '"https://meet.jit.si"';
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: `camera=(self ${JITSI}), microphone=(self ${JITSI}), display-capture=(self ${JITSI}), geolocation=()`,
  },
];

// Hostnames https de onde se aceitam imagens externas (storage, CDN). Vazio =
// qualquer https (comportamento anterior). Tem de ser o mesmo valor em build
// (remotePatterns) e em runtime (img-src da CSP, no middleware).
const imageHosts = (process.env.IMG_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && imageHosts.length === 0) {
  console.warn(
    '[security] IMG_ALLOWED_HOSTS vazio: img-src da CSP e next/image aceitam imagens de QUALQUER https. ' +
      'Defina os hostnames do storage/CDN em produção.',
  );
}

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    reactCompiler: true,
  },
  images: {
    // https apenas — imagens http:// eram mixed content (achado F2).
    remotePatterns: (imageHosts.length ? imageHosts : ['**']).map(
      (hostname) => ({
        protocol: 'https' as const,
        hostname,
      }),
    ),
  },
  // simli-client@3.0.3 faz require('./transports/...') e require('../signaling/...')
  // mas o pacote publica as pastas como `Transports/` e `Signaling/`. Em
  // Windows/macOS (FS insensível a maiúsculas) funciona; no Linux do
  // CI/produção o build falha com "Module not found".
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^(\.\/transports|\.\.\/signaling)\//,
        (resource: { request: string; context: string }) => {
          if (resource.context.includes('simli-client')) {
            resource.request = resource.request
              .replace('./transports/', './Transports/')
              .replace('../signaling/', '../Signaling/');
          }
        },
      ),
    );
    return config;
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        // Proxy de dev para o Nest. Em produção o Caddy interceta /api antes
        // de chegar ao Next — este rewrite fica inerte.
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL ?? 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
