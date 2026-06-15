// Helpers de autenticação do lado do cliente.
//
// IMPORTANTE: o token JWT vive num cookie httpOnly definido pelo backend. O
// JavaScript NUNCA lê nem escreve o token (mitiga XSS). Por isso aqui não há
// getToken()/setToken() — apenas o logout, que pede ao backend para limpar o
// cookie.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Mesmo que a chamada falhe, seguimos para o login.
  } finally {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}
