import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { Frame } from './types.ts'

/** Sur l'écran du cadre : QR code et code pour que la famille le rejoigne depuis son smartphone. */
export default function Invite({ frame }: { frame: Frame }) {
  const [qr, setQr] = useState<string | null>(null)
  // Adresse de cette page : ouvrir le cadre via l'IP du PC (pas localhost) pour qu'un smartphone puisse la joindre
  const link = `${window.location.origin}/?code=${frame.inviteCode}`

  useEffect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 240 })
      .then(setQr)
      .catch(() => setQr(null)) // le code reste affiché
  }, [link])

  return (
    <aside className="invite">
      {qr && <img src={qr} alt={`QR code pour rejoindre le cadre ${frame.name}`} />}
      <p>
        <strong>{frame.name}</strong>
        Scannez pour envoyer vos photos
        <br />
        ou saisissez le code <code>{`${frame.inviteCode.slice(0, 5)}-${frame.inviteCode.slice(5)}`}</code>
      </p>
    </aside>
  )
}
