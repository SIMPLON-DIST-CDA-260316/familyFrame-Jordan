// Vide en local : URL relatives, le proxy Vite redirige vers le backend. Dans Docker : http://localhost:3000, appelé par le navigateur.
export const API_URL: string = import.meta.env.VITE_API_URL ?? ''

/** POST JSON vers l'API ; credentials : le cookie de session part et revient malgré l'origine différente (Docker). */
export const postJson = (path: string, body: unknown) =>
  fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

/** Message d'erreur renvoyé par l'API ({ error }), ou un message générique. */
export async function readError(response: Response) {
  const data: { error?: string } | null = await response.json().catch(() => null)
  return data?.error ?? `Erreur du serveur (${response.status})`
}
