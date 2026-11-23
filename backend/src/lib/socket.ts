import type { Photo } from '@prisma/client'
import { Server } from 'socket.io'

// Événements envoyés par le serveur aux cadres (typés pour io.emit).
type ServerToClientEvents = {
  'photo:new': (photo: Photo) => void
  'photo:deleted': (id: string) => void
}

// Créé ici pour être importé par les routes, attaché au serveur HTTP dans index.ts.
export const io = new Server<Record<string, never>, ServerToClientEvents>()

io.on('connection', (socket) => {
  console.log(`Cadre connecté (${socket.id})`)
  socket.on('disconnect', (reason) => console.log(`Cadre déconnecté (${socket.id}) : ${reason}`))
})
