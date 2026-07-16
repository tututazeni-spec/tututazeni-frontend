import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
  const authorization = req.headers.get("authorization") ?? "";

  try {
    const res = await fetch(`${apiUrl}/users`, {
      cache: "no-store",
      headers: { authorization },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Erro ao buscar utilizadores" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Servidor indisponível" },
      { status: 503 }
    );
  }
}
 