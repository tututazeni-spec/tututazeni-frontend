import { NextResponse } from "next/server";

export async function GET() {
  const users = [
    {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@email.com",
    },
    {
      id: 3,
      name: "Pedro Costa",
      email: "pedro@email.com",
    },
  ];

  return NextResponse.json(users);
}
