// Vide en local : URL relatives, le proxy Vite redirige vers le backend. Dans Docker : http://localhost:3000, appelé par le navigateur.
export const API_URL: string = import.meta.env.VITE_API_URL ?? ''
