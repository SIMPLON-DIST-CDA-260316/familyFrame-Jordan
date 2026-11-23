import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'

// Le SDK lit CLOUDINARY_URL automatiquement ; on vérifie au démarrage pour échouer clairement.
if (!process.env.CLOUDINARY_URL) {
  throw new Error('CLOUDINARY_URL manquante : copier backend/.env.example en backend/.env et la renseigner.')
}

/** Envoie une image (déjà réencodée par Sharp) sur Cloudinary, depuis la mémoire. */
export function uploadImage(image: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'familyframe', resource_type: 'image' }, (error, result) => {
        if (error || !result) reject(error ?? new Error('Réponse Cloudinary vide.'))
        else resolve(result)
      })
      .end(image)
  })
}
