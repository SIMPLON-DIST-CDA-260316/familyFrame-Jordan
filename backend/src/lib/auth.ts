import type { RequestHandler, Response } from 'express'
import { parseCookie } from 'cookie'
import { jwtVerify, SignJWT } from 'jose'
import { httpError } from './http-error.ts'

const COOKIE_NAME = 'familyframe_session'
const DURATION_S = 365 * 24 * 60 * 60 // Mamie ne doit jamais avoir à se reconnecter

if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
  throw new Error('JWT_SECRET manquant ou trop court (32 caractères minimum, voir .env.example).')
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

/** JWT signé dont le sujet est le cadre auquel ce navigateur a accès. */
export const createSessionToken = (frameId: string) =>
  new SignJWT().setProtectedHeader({ alg: 'HS256' }).setSubject(frameId).setIssuedAt().setExpirationTime(`${DURATION_S}s`).sign(secret)

/** Identifiant du cadre lu dans l'en-tête Cookie, ou null si le jeton est absent, falsifié ou expiré. */
export async function readSession(cookieHeader: string | undefined): Promise<string | null> {
  const token = parseCookie(cookieHeader ?? '')[COOKIE_NAME]
  if (!token) return null
  try {
    // algorithms imposé : refuse un jeton signé avec un autre algorithme que celui choisi par le serveur
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return payload.sub ?? null
  } catch {
    return null
  }
}

export async function setSessionCookie(res: Response, frameId: string) {
  res.cookie(COOKIE_NAME, await createSessionToken(frameId), {
    httpOnly: true, // illisible par le JavaScript de la page (XSS)
    sameSite: 'lax', // front :5173 et API :3000 = même site : le cookie part quand même avec les requêtes du front
    maxAge: DURATION_S * 1000,
    // shortcut: pas de `secure`, l'app tourne en HTTP sur le Wi-Fi ; l'activer dès qu'elle passe en HTTPS.
  })
}

/** Refuse la requête sans session de cadre valide ; sinon le cadre est disponible dans res.locals.frameId. */
export const requireFrame: RequestHandler = async (req, res, next) => {
  const frameId = await readSession(req.headers.cookie)
  if (!frameId) throw httpError(401, 'Rejoignez un cadre pour continuer.')
  res.locals.frameId = frameId
  next()
}
