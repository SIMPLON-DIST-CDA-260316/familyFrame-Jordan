import { Router, type ErrorRequestHandler } from 'express'
import multer from 'multer'
import { requireFrame } from '../lib/auth.ts'
import { deleteImage, uploadImage } from '../lib/cloudinary.ts'
import { httpError } from '../lib/http-error.ts'
import { processImage } from '../lib/image.ts'
import { prisma } from '../lib/prisma.ts'
import { io } from '../lib/socket.ts'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const PSEUDO_MAX_LENGTH = 30

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 1, fieldSize: 1024 },
  // Pré-filtre seulement : le mimetype est déclaré par le client, Sharp vérifie le vrai contenu.
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(httpError(415, 'Le fichier envoyé n’est pas une image.'))
  },
})

export const photosRouter = Router()
// Avant Multer : une requête sans session est refusée sans lire le fichier. Chaque route ne voit que le cadre du jeton.
photosRouter.use(requireFrame)

photosRouter.get('/', async (req, res) => {
  const limit = Number(req.query.limit ?? 20)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw httpError(400, 'Le paramètre limit doit être un entier entre 1 et 100.')
  }
  const photos = await prisma.photo.findMany({
    where: { frameId: res.locals.frameId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  res.json(photos)
})

photosRouter.post('/', upload.single('photo'), async (req, res) => {
  const pseudo = typeof req.body?.pseudo === 'string' ? req.body.pseudo.trim() : ''
  if (!pseudo || pseudo.length > PSEUDO_MAX_LENGTH) {
    throw httpError(400, `Le pseudo est obligatoire (${PSEUDO_MAX_LENGTH} caractères maximum).`)
  }
  if (!req.file) throw httpError(400, 'Aucune photo reçue.')

  const image = await processImage(req.file.buffer)
  const uploaded = await uploadImage(image)

  const photo = await prisma.photo
    .create({ data: { url: uploaded.secure_url, publicId: uploaded.public_id, pseudo, frameId: res.locals.frameId } })
    .catch(async (error) => {
      // Pas d'image orpheline sur Cloudinary si la base refuse l'enregistrement
      await deleteImage(uploaded.public_id).catch((cleanupError) =>
        console.error(`Suppression Cloudinary impossible pour ${uploaded.public_id}`, cleanupError),
      )
      throw error
    })

  io.to(photo.frameId).emit('photo:new', photo) // les écrans de ce cadre l'affichent sans rechargement
  res.status(201).json(photo)
})

// Tout membre du cadre peut supprimer ses photos (choix de la spec)
photosRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  if (!/^[a-f\d]{24}$/i.test(id)) throw httpError(400, 'Identifiant de photo invalide.')

  const photo = await prisma.photo.delete({ where: { id, frameId: res.locals.frameId } }).catch((error) => {
    // P2025 : aucune photo avec cet id dans ce cadre ; celle d'un autre cadre est traitée comme inexistante
    if (error?.code === 'P2025') throw httpError(404, 'Photo introuvable.')
    throw error
  })

  // Base d'abord : si Cloudinary échoue, il reste un fichier orphelin invisible plutôt qu'une photo cassée sur le mur
  await deleteImage(photo.publicId).catch((error) =>
    console.error(`Suppression Cloudinary impossible pour ${photo.publicId}`, error),
  )

  io.to(photo.frameId).emit('photo:deleted', photo.id)
  res.status(204).end()
})

// Traduit les erreurs Multer (messages en anglais, sans code HTTP) avant le gestionnaire global.
const multerErrors: ErrorRequestHandler = (err, _req, _res, next) => {
  if (!(err instanceof multer.MulterError)) return next(err)
  if (err.code === 'LIMIT_FILE_SIZE') return next(httpError(413, 'Photo trop lourde (10 Mo maximum).'))
  next(httpError(400, 'Requête invalide : un pseudo et une seule photo sont attendus.'))
}
photosRouter.use(multerErrors)
