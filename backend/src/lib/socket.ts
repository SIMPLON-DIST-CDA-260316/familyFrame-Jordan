import type { Photo } from '@prisma/client'
import { Server } from 'socket.io'
import { readSession } from './auth.ts'

// Événements envoyés par le serveur aux cadres (typés pour io.to().emit).
type ServerToClientEvents = {
  'photo:new': (photo: Photo) => void
  'photo:deleted': (id: string) => void
}
type SocketData = { frameId: string }

// Créé ici pour être importé par les routes, attaché au serveur HTTP dans index.ts.
const corsOrigin = process.env.CORS_ORIGIN
export const io = new Server<Record<string, never>, ServerToClientEvents, Record<string, never>, SocketData>({
  // credentials : le navigateur joint le cookie de session à la connexion malgré l'origine différente
  cors: corsOrigin ? { origin: corsOrigin, credentials: true } : undefined,
})

// Vérifié une fois, à la connexion : sans session valide, le client reçoit connect_error et n'entre dans aucune room
io.use(async (socket, next) => {
  const frameId = await readSession(socket.handshake.headers.cookie)
  if (!frameId) return next(new Error('Rejoignez un cadre pour continuer.'))
  socket.data.frameId = frameId
  next()
})

io.on('connection', (socket) => {
  // Une room par cadre, nommée par son id : io.to(frameId) ne touche que les écrans de ce cadre
  socket.join(socket.data.frameId)
  console.log(`Cadre ${socket.data.frameId} connecté (${socket.id})`)
  socket.on('disconnect', (reason) => console.log(`Cadre ${socket.data.frameId} déconnecté (${socket.id}) : ${reason}`))
})
