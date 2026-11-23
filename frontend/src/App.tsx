import { useState, type ChangeEvent, type FormEvent } from 'react'

type Status =
  | { type: 'idle' }
  | { type: 'sending' }
  | { type: 'success' }
  | { type: 'error'; message: string }

export default function App() {
  const [pseudo, setPseudo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ type: 'idle' })

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
      const response = await fetch('/api/photos', { method: 'POST', body })
      if (!response.ok) {
        const data: { error?: string } | null = await response.json().catch(() => null)
        throw new Error(data?.error ?? `Erreur du serveur (${response.status})`)
      }
      showPreview(null)
      setStatus({ type: 'success' })
    } catch (error) {
      const message =
        error instanceof TypeError
          ? 'Serveur injoignable, vérifiez votre connexion.'
          : (error as Error).message
      setStatus({ type: 'error', message })
    }
  }

  const sending = status.type === 'sending'

  return (
    <main className="send">
      <h1>FamilyFrame</h1>
      <p>Envoyez une photo, elle apparaît aussitôt sur le cadre.</p>

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
    </main>
  )
}
