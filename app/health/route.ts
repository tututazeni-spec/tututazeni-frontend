// Liveness probe do container frontend. Fora de /api → o Caddy serve-a a
// partir do Next em produção; não colide com /api/health/ready do backend.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
