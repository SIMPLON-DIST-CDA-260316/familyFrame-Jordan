import { useEffect, useState } from 'react'
import { API_URL, postJson, readError } from './api.ts'
import App from './App.tsx'
import Home from './Home.tsx'
import type { Frame } from './types.ts'

type State = { type: 'loading' } | { type: 'home'; error?: string } | { type: 'ready'; frame: Frame }

const RETRY_DELAY = 3000

/** Cadre de ce navigateur : rejoint via le lien du QR code (/?code=…), sinon lu depuis le cookie de session. */
export default function Session() {
  const [state, setState] = useState<State>({ type: 'loading' })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const code = new URLSearchParams(window.location.search).get('code')

    async function load() {
      try {
        const response = code
          ? await postJson('/api/frames/join', { code })
          : await fetch(`${API_URL}/api/frames/current`, { credentials: 'include' })
        if (response.status >= 500) throw new Error(`Erreur du serveur (${response.status})`)
        if (cancelled) return
        if (code) {
          // Le code ne reste pas dans l'URL (historique, capture d'écran) ; ?cadre est conservé
          const url = new URL(window.location.href)
          url.searchParams.delete('code')
          window.history.replaceState(null, '', url)
        }
        if (response.ok) setState({ type: 'ready', frame: await response.json() })
        else setState({ type: 'home', error: code ? await readError(response) : undefined }) // 401 : pas encore de cadre
      } catch {
        // Serveur injoignable : l'écran du cadre réessaie seul, Mamie n'a rien à toucher
        if (!cancelled) timer = setTimeout(load, RETRY_DELAY)
      }
    }
    load()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  if (state.type === 'ready') return <App key={state.frame.id} frame={state.frame} />
  if (state.type === 'home') return <Home error={state.error} onReady={(frame) => setState({ type: 'ready', frame })} />
  return (
    <main className="wall">
      <p className="offline" role="status">
        Connexion au serveur en cours…
      </p>
    </main>
  )
}
