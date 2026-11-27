import { useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import { API_URL } from './api.ts'

type Status =
  | { type: 'idle' }
  | { type: 'sending' }
  | { type: 'success' }
  | { type: 'error'; message: string }

/** Bouton flottant + panneau d'envoi (<dialog> natif : focus, Échap et accessibilité gérés par le navigateur). */
export default function SendPanel({ frameName }: { frameName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pseudo, setPseudo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const sending = status.type === 'sending'

  function open() {
    setStatus({ type: 'idle' })
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  // Le panneau intérieur couvre tout le <dialog> : un clic dont la cible est le <dialog> vient du fond
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !sending) close()
  }

  function showPreview(next: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(next ? URL.createObjectURL(next) : null)
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = '' // permet de resélectionner la même image
    if (!selected) return
    showPreview(selected)
    setStatus({ type: 'idle' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) return
    setStatus({ type: 'sending' })

    const body = new FormData()
    // Le pseudo avant le fichier : Multer ne remplit req.body qu'avec les champs déjà reçus
    body.append('pseudo', pseudo.trim())
    body.append('photo', file)

    try {
      const response = await fetch(`${API_URL}/api/photos`, { method: 'POST', body, credentials: 'include' })
      if (!response.ok) {
        const data: { error?: string } | null = await response.json().catch(() => null)
        throw new Error(data?.error ?? `Erreur du serveur (${response.status})`)
      }
      showPreview(null)
      setStatus({ type: 'success' })
      setTimeout(close, 1500) // laisse voir la confirmation, puis la photo arriver sur le mur
    } catch (error) {
      const message =
        error instanceof TypeError
          ? 'Serveur injoignable, vérifiez votre connexion.'
          : (error as Error).message
      setStatus({ type: 'error', message })
    }
  }

  return (
    <>
      <button type="button" className="fab" onClick={open}>
        + Envoyer une photo
      </button>

      <dialog
        ref={dialogRef}
        className="send-panel"
        aria-labelledby="send-title"
        onClick={handleBackdropClick}
        onCancel={(event) => sending && event.preventDefault()}
      >
        <div className="send-inner">
          <button type="button" className="close" onClick={close} disabled={sending} aria-label="Fermer">
            ×
          </button>
          <h2 id="send-title">Envoyer une photo</h2>
          <p className="hint">
            Elle apparaîtra aussitôt sur le cadre <strong>{frameName}</strong>.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="field">
              Votre pseudo
              <input
                value={pseudo}
                onChange={(event) => setPseudo(event.target.value)}
                required
                maxLength={30}
                autoComplete="nickname"
                disabled={sending}
              />
            </label>

            <div className="pickers">
              <label className="button">
                📷 Prendre une photo
                <input
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFile}
                  disabled={sending}
                />
              </label>
              <label className="button secondary">
                🖼️ Choisir une image
                <input
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  disabled={sending}
                />
              </label>
            </div>

            {preview && <img className="preview" src={preview} alt="Aperçu de la photo à envoyer" />}

            <button type="submit" className="button" disabled={!file || !pseudo.trim() || sending}>
              {sending ? 'Envoi en cours…' : 'Envoyer'}
            </button>
          </form>

          <p role="status" className={`status ${status.type}`}>
            {status.type === 'success' && 'Photo envoyée ! 🎉'}
            {status.type === 'error' && status.message}
          </p>
        </div>
      </dialog>
    </>
  )
}
