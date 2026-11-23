import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { seed, sized } from './photos.ts'
import SendPanel from './SendPanel.tsx'
import { usePhotos } from './usePhotos.ts'

// Emplacements du décor autour de la photo principale (en % de l'écran, profondeur en px).
// Les 6 premiers restent visibles sur téléphone.
const SLOTS = [
  { x: 12, y: 16, z: -260 },
  { x: 88, y: 18, z: -240 },
  { x: 10, y: 82, z: -300 },
  { x: 90, y: 84, z: -280 },
  { x: 50, y: 10, z: -460 },
  { x: 50, y: 92, z: -440 },
  { x: 30, y: 30, z: -560 },
  { x: 72, y: 28, z: -520 },
  { x: 6, y: 50, z: -220 },
  { x: 94, y: 52, z: -200 },
  { x: 28, y: 72, z: -540 },
  { x: 72, y: 74, z: -500 },
]
const TAPES = ['var(--red)', 'var(--green)', 'var(--gold)']
const BULBS = 18
const FLAKES = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: -((i * 1.7) % 12),
  duration: 10 + ((i * 7) % 9),
  size: 3 + (i % 4),
}))
const FOCUS_DURATION = 10_000

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
// Sur l'écran du cadre (/?cadre) : pas de bouton d'envoi ni de curseur
const frameMode = new URLSearchParams(window.location.search).has('cadre')

type Focus = { id: string; arrivedId: string | null }

export default function App() {
  const { photos, connected, arrivedId } = usePhotos()
  const [focus, setFocus] = useState<Focus | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  // Une ancienne photo agrandie revient au décor après quelques secondes
  useEffect(() => {
    if (!focus) return
    const timer = setTimeout(() => setFocus(null), FOCUS_DURATION)
    return () => clearTimeout(timer)
  }, [focus])

  // Une nouvelle photo reçue annule l'agrandissement : la dernière reste prioritaire
  const focusedId = focus && focus.arrivedId === arrivedId ? focus.id : null
  const main = photos.find((photo) => photo.id === focusedId) ?? photos[0]
  const decor = photos.filter((photo) => photo !== main).slice(0, SLOTS.length)

  // Parallaxe : on écrit les variables CSS directement, sans re-render React à chaque mouvement
  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const x = event.clientX / window.innerWidth - 0.5
    const y = event.clientY / window.innerHeight - 0.5
    sceneRef.current?.style.setProperty('--ry', `${x * 6}deg`)
    sceneRef.current?.style.setProperty('--rx', `${-y * 4}deg`)
  }

  return (
    <main className={`wall${frameMode ? ' is-frame' : ''}`} onPointerMove={handlePointerMove}>
      <div className="garland" aria-hidden="true">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none">
          <path d="M0 0 Q50 20 100 0" />
        </svg>
        {Array.from({ length: BULBS }, (_, i) => {
          const t = (i + 0.5) / BULBS
          return (
            <span
              key={i}
              style={{ '--t': t, '--sag': 4 * t * (1 - t), '--c': TAPES[i % 3], '--delay': `${(i % 5) * -0.4}s` } as CSSProperties}
            />
          )
        })}
      </div>

      <div className="scene" ref={sceneRef}>
        {decor.map((photo, i) => {
          const n = seed(photo.id)
          const style = {
            '--x': `${SLOTS[i].x}%`,
            '--y': `${SLOTS[i].y}%`,
            '--z': `${SLOTS[i].z}px`,
            '--r': `${(n % 17) - 8}deg`,
            '--tape': TAPES[n % 3],
            '--delay': `${-(n % 7)}s`,
          } as CSSProperties
          return (
            <button
              key={photo.id}
              type="button"
              className="polaroid decor"
              style={style}
              onClick={() => setFocus({ id: photo.id, arrivedId })}
              aria-label={`Agrandir la photo de ${photo.pseudo}`}
            >
              <img src={sized(photo.url, 400)} alt="" loading="lazy" />
              <span className="caption">{photo.pseudo}</span>
            </button>
          )
        })}

        {main ? (
          <figure
            key={main.id}
            className={`polaroid main-photo${loadedId === main.id ? ' is-loaded' : ''}`}
            style={{ '--tape': TAPES[seed(main.id) % 3] } as CSSProperties}
          >
            <img
              src={sized(main.url, 1600)}
              alt={`Photo envoyée par ${main.pseudo}`}
              onLoad={() => setLoadedId(main.id)}
            />
            <figcaption>
              <strong>{main.pseudo}</strong>
              <time dateTime={main.createdAt}>{dateFormat.format(new Date(main.createdAt))}</time>
            </figcaption>
            {main.id === arrivedId && !focusedId && <span className="stamp">Nouvelle photo !</span>}
          </figure>
        ) : (
          <figure className="polaroid main-photo is-loaded is-empty">
            <div className="placeholder">En attente de la première photo…</div>
          </figure>
        )}
      </div>

      <div className="flakes" aria-hidden="true">
        {FLAKES.map((flake, i) => (
          <span
            key={i}
            style={{
              '--left': `${flake.left}%`,
              '--delay': `${flake.delay}s`,
              '--duration': `${flake.duration}s`,
              '--size': `${flake.size}px`,
            } as CSSProperties}
          />
        ))}
      </div>

      {!connected && (
        <p className="offline" role="status">
          Connexion au serveur en cours…
        </p>
      )}

      {!frameMode && <SendPanel />}
    </main>
  )
}
