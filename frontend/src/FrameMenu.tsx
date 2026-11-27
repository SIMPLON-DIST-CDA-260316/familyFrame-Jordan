import { useRef, type MouseEvent } from 'react'
import Invite from './Invite.tsx'
import type { Frame } from './types.ts'

type Props = {
  frame: Frame
  onChangeFrame: () => void
}

/** Pastille « cadre courant » + panneau : inviter la famille, passer en mode cadre, changer de cadre. */
export default function FrameMenu({ frame, onChangeFrame }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Le panneau intérieur couvre tout le <dialog> : un clic dont la cible est le <dialog> vient du fond
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) dialogRef.current?.close()
  }

  return (
    <>
      <button type="button" className="frame-chip" onClick={() => dialogRef.current?.showModal()}>
        🖼️ {frame.name} <span aria-hidden="true">▾</span>
      </button>

      <dialog ref={dialogRef} className="send-panel" aria-labelledby="frame-title" onClick={handleBackdropClick}>
        <div className="send-inner">
          <button type="button" className="close" onClick={() => dialogRef.current?.close()} aria-label="Fermer">
            ×
          </button>
          <h2 id="frame-title">{frame.name}</h2>
          <p className="hint">Invitez la famille : elle pourra envoyer des photos sur ce cadre.</p>

          <Invite frame={frame} />

          <div className="menu-actions">
            <a className="button" href="?cadre">
              📺 Afficher en mode cadre
            </a>
            <button type="button" className="button secondary" onClick={onChangeFrame}>
              🔁 Changer de cadre
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
