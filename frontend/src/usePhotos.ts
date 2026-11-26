import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL } from './api.ts'
import { mergePhotos, WALL_SIZE } from './photos.ts'
import type { Photo } from './types.ts'

type ServerToClientEvents = {
  'photo:new': (photo: Photo) => void
  'photo:deleted': (id: string) => void
}

/** Photos du mur, tenues à jour en temps réel. `arrivedId` = dernière photo reçue en direct. */
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [connected, setConnected] = useState(false)
  const [arrivedId, setArrivedId] = useState<string | null>(null)

  useEffect(() => {
    // Sans API_URL : même origine que la page (proxy Vite)
    const socket: Socket<ServerToClientEvents> = io(API_URL || undefined)

    const refresh = () =>
      fetch(`${API_URL}/api/photos?limit=${WALL_SIZE}`)
        .then((response) => (response.ok ? response.json() : []))
        .then((list: Photo[]) => setPhotos((current) => mergePhotos(current, list)))
        .catch(() => {}) // la reconnexion suivante réessaiera

    socket.on('connect', () => {
      setConnected(true)
      refresh() // à chaque (re)connexion : rattrape les photos envoyées pendant une coupure
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('photo:deleted', (id) => {
      setPhotos((current) => current.filter((photo) => photo.id !== id))
      refresh() // complète le mur avec la photo suivante
    })
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
