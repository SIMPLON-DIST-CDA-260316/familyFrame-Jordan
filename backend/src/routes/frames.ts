import express, { Router } from 'express'
import { requireFrame, setSessionCookie } from '../lib/auth.ts'
import { httpError } from '../lib/http-error.ts'
import { createInviteCode, normalizeInviteCode } from '../lib/invite-code.ts'
import { prisma } from '../lib/prisma.ts'

const NAME_MAX_LENGTH = 50

export const framesRouter = Router()
framesRouter.use(express.json({ limit: '1kb' }))

// Crée un cadre (écran de Mamie) : ce navigateur en devient membre
framesRouter.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name || name.length > NAME_MAX_LENGTH) {
    throw httpError(400, `Le nom du cadre est obligatoire (${NAME_MAX_LENGTH} caractères maximum).`)
  }
  const frame = await prisma.frame.create({ data: { name, inviteCode: createInviteCode() } })
  await setSessionCookie(res, frame.id)
  res.status(201).json(frame)
})

// Rejoint un cadre existant : le code est vérifié ici, côté serveur
framesRouter.post('/join', async (req, res) => {
  if (typeof req.body?.code !== 'string') throw httpError(400, 'Le code d’invitation est obligatoire.')
  const frame = await prisma.frame.findUnique({ where: { inviteCode: normalizeInviteCode(req.body.code) } })
  if (!frame) throw httpError(404, 'Code d’invitation inconnu.')
  await setSessionCookie(res, frame.id)
  res.json(frame)
})

// Cadre de ce navigateur : le front sait s'il doit afficher l'accueil (401) ou le mur
framesRouter.get('/current', requireFrame, async (_req, res) => {
  const frame = await prisma.frame.findUnique({ where: { id: res.locals.frameId } })
  if (!frame) throw httpError(401, 'Rejoignez un cadre pour continuer.')
  res.json(frame)
})
