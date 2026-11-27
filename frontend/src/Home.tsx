import { useState, type FormEvent } from 'react'
import { postJson, readError } from './api.ts'
import type { Frame } from './types.ts'

type Props = {
  error?: string // erreur du lien d'invitation (code inconnu)
  onReady: (frame: Frame) => void
}

/** Accueil sans session : rejoindre un cadre avec son code, ou en créer un (écran de Mamie). */
export default function Home({ error: linkError, onReady }: Props) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(linkError ?? null)

  async function submit(event: FormEvent<HTMLFormElement>, path: string, body: object) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await postJson(path, body)
      if (!response.ok) throw new Error(await readError(response))
      onReady(await response.json())
    } catch (caught) {
      setError(caught instanceof TypeError ? 'Serveur injoignable, vérifiez votre connexion.' : (caught as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="wall">
      <section className="send-panel home" aria-labelledby="home-title">
        <div className="send-inner">
          <h2 id="home-title">FamilyFrame</h2>
          <p className="hint">Le cadre photo partagé de toute la famille.</p>

          <form onSubmit={(event) => submit(event, '/api/frames/join', { code })}>
            <label className="field">
              Code d'invitation
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                maxLength={20}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Affiché sous le QR code du cadre"
                disabled={busy}
              />
            </label>
            <button type="submit" className="button" disabled={busy || !code.trim()}>
              Rejoindre le cadre
            </button>
          </form>

          <p className="or">ou</p>

          <form onSubmit={(event) => submit(event, '/api/frames', { name })}>
            <label className="field">
              Nom du nouveau cadre
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={50}
                placeholder="Chez Mamie et Papi"
                disabled={busy}
              />
            </label>
            <button type="submit" className="button secondary" disabled={busy || !name.trim()}>
              Créer un cadre
            </button>
          </form>

          <p role="status" className="status error">
            {error}
          </p>
        </div>
      </section>
    </main>
  )
}
