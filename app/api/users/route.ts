import { NextResponse } from "next/server";
 
export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
 
  try {
    const res = await fetch(`${apiUrl}/users`, { cache: "no-store" });
 
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
 