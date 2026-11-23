import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { Photo } from './types.ts'

type ServerToClientEvents = {
  'photo:new': (photo: Photo) => void
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

export default function Frame() {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Même origine que la page : le proxy Vite redirige /socket.io vers le backend
    const socket: Socket<ServerToClientEvents> = io()

    // Garde toujours la plus récente, quel que soit l'ordre d'arrivée (fetch ou temps réel)
    const showIfNewer = (next: Photo) =>
      setPhoto((current) => (!current || next.createdAt > current.createdAt ? next : current))

    socket.on('connect', () => {
      setConnected(true)
      // À chaque (re)connexion : rattrape une photo envoyée pendant une coupure
      fetch('/api/photos?limit=1')
        .then((response) => (response.ok ? response.json() : []))
        .then((photos: Photo[]) => photos[0] && showIfNewer(photos[0]))
        .catch(() => {}) // la reconnexion suivante réessaiera
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('photo:new', showIfNewer)

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <main className="frame">
      {photo ? (
        <figure>
          <img key={photo.id} src={photo.url} alt={`Photo envoyée par ${photo.pseudo}`} />
          <figcaption>
            <strong>{photo.pseudo}</strong> · {dateFormat.format(new Date(photo.createdAt))}
          </figcaption>
        </figure>
      ) : (
        <p className="frame-empty">En attente de la première photo…</p>
      )}
      {!connected && (
        <p className="frame-offline" role="status">
          Connexion au serveur en cours…
        </p>
      )}
    </main>
  )
}
