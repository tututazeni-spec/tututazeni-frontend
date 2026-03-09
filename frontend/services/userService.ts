import { api } from "./api";
import { User } from "../types/user";

export async function getUsers(): Promise<User[]> {
  try {
    const response = await api.get("/api/users");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw new Error("Falha ao carregar usuários");
  }
}
