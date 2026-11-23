import type { Photo } from './types.ts'

// La dernière photo au premier plan + 12 anciennes en décor
export const WALL_SIZE = 13

/** Fusionne des photos sans doublon, les plus récentes d'abord, limité à WALL_SIZE. */
export function mergePhotos(current: Photo[], incoming: Photo[]): Photo[] {
  const byId = new Map(current.map((photo) => [photo.id, photo]))
  for (const photo of incoming) byId.set(photo.id, photo)
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, WALL_SIZE)
}

/** URL Cloudinary redimensionnée à la volée (format et qualité adaptés au navigateur). */
export const sized = (url: string, width: number) =>
  url.replace('/image/upload/', `/image/upload/c_limit,w_${width},q_auto,f_auto/`)

/** Nombre stable tiré de l'id MongoDB (hexadécimal) : même inclinaison à chaque affichage. */
export const seed = (id: string) => parseInt(id.slice(-6), 16)
