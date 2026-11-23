import sharp from 'sharp'
import { httpError } from './http-error.ts'

// AVIF est signalé par Sharp comme 'heif' (compression av1). SVG, GIF, TIFF… sont refusés.
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif'])
// Couvre les capteurs 48 Mpx des smartphones ; au-delà, risque de saturer la mémoire au décodage.
export const MAX_PIXELS = 50_000_000
const MAX_SIZE = 1920

/**
 * Contrôle une image reçue du client puis la recrée entièrement :
 * décodage en pixels, redressement EXIF, redimensionnement, réencodage JPEG.
 * Les métadonnées d'origine (EXIF, GPS…) ne sont pas recopiées.
 */
export async function processImage(input: Buffer): Promise<Buffer> {
  // Lecture de l'en-tête seulement (pas de décodage) : on vérifie avant de décoder les pixels.
  // Sans limitInputPixels ici, sinon une image trop grande serait signalée comme illisible.
  const metadata = await sharp(input)
    .metadata()
    .catch(() => {
      throw httpError(415, 'Image illisible ou format non pris en charge.')
    })

  if (!ALLOWED_FORMATS.has(metadata.format)) {
    throw httpError(415, 'Format non pris en charge (JPEG, PNG, WebP, HEIF ou AVIF).')
  }
  if (metadata.width * metadata.height > MAX_PIXELS) {
    throw httpError(413, 'Image trop grande (50 mégapixels maximum).')
  }

  // limitInputPixels : filet de sécurité si l'en-tête ment sur les dimensions
  return sharp(input, { failOn: 'error', limitInputPixels: MAX_PIXELS })
    .autoOrient()
    .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' }) // le JPEG n'a pas de transparence : fond blanc plutôt que noir
    .jpeg({ quality: 85 })
    .toBuffer()
    .catch(() => {
      throw httpError(415, 'Image illisible ou format non pris en charge.')
    })
}
