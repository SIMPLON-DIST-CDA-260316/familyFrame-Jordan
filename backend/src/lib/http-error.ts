// Erreur 4xx dont le message peut être renvoyé au client (voir le gestionnaire d'erreurs dans index.ts).
export const httpError = (status: number, message: string) => Object.assign(new Error(message), { status })
