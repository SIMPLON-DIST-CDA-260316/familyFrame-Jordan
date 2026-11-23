import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { mergePhotos, WALL_SIZE } from './photos.ts'
import type { Photo } from './types.ts'

type ServerToClientEvents = {
  'photo:new': (photo: Photo) => void
}

/** Photos du mur, tenues à jour en temps réel. `arrivedId` = dernière photo reçue en direct. */
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [connected, setConnected] = useState(false)
  const [arrivedId, setArrivedId] = useState<string | null>(null)

  useEffect(() => {
    // Même origine que la page : le proxy Vite redirige /socket.io vers le backend
    const socket: Socket<ServerToClientEvents> = io()

    socket.on('connect', () => {
      setConnected(true)
      // À chaque (re)connexion : rattrape les photos envoyées pendant une coupure
      fetch(`/api/photos?limit=${WALL_SIZE}`)
        .then((response) => (response.ok ? response.json() : []))
        .then((list: Photo[]) => setPhotos((current) => mergePhotos(current, list)))
        .catch(() => {}) // la reconnexion suivante réessaiera
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('photo:new', (photo) => {
      setPhotos((current) => mergePhotos(current, [photo]))
      setArrivedId(photo.id)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return { photos, connected, arrivedId }
}
