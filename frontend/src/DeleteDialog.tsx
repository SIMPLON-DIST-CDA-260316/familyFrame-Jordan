import { useEffect, useRef, useState } from 'react'
import type { Photo } from './types.ts'

type Props = {
  photo: Photo | null // photo à supprimer ; null = fenêtre fermée
  onClose: () => void
}

/** Confirmation de suppression (<dialog> natif plutôt que window.confirm). */
export default function DeleteDialog({ photo, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (photo) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [photo])

  function handleClose() {
    setError(null)
    onClose()
  }

  async function confirmDelete() {
    if (!photo) return
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
      // 404 : déjà supprimée depuis un autre écran, le résultat est le même
      if (!response.ok && response.status !== 404) {
        const data: { error?: string } | null = await response.json().catch(() => null)
        throw new Error(data?.error ?? `Erreur du serveur (${response.status})`)
      }
      dialogRef.current?.close() // déclenche handleClose ; le mur se met à jour via Socket.IO
    } catch (caught) {
      setError(caught instanceof TypeError ? 'Serveur injoignable, vérifiez votre connexion.' : (caught as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="send-panel confirm"
      aria-labelledby="delete-title"
      onClose={handleClose}
      onCancel={(event) => deleting && event.preventDefault()}
    >
      <div className="send-inner">
        <h2 id="delete-title">Supprimer cette photo ?</h2>
        {photo && (
          <p className="hint">
            La photo de <strong>{photo.pseudo}</strong> disparaîtra du cadre et de l'hébergement. Action définitive.
          </p>
        )}
        <div className="confirm-actions">
          <button type="button" className="button secondary" onClick={() => dialogRef.current?.close()} disabled={deleting}>
            Annuler
          </button>
          <button type="button" className="button" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
        <p role="status" className="status error">
          {error}
        </p>
      </div>
    </dialog>
  )
}
