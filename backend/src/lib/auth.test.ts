import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SignJWT } from 'jose'

process.env.JWT_SECRET = 'secret-de-test-de-plus-de-32-caracteres'
// Import dynamique : le module lit JWT_SECRET à son chargement
const { createSessionToken, readSession } = await import('./auth.ts')

const cookie = (token: string) => `autre=1; familyframe_session=${token}`
const frameId = '6b0958db2ca2c47e3a4ca4fd'

test('un jeton valide donne le cadre', async () => {
  assert.equal(await readSession(cookie(await createSessionToken(frameId))), frameId)
})

test('sans cookie : pas de session', async () => {
  assert.equal(await readSession(undefined), null)
  assert.equal(await readSession('autre=1'), null)
})

test('un jeton modifié est refusé', async () => {
  const [header, , signature] = (await createSessionToken(frameId)).split('.')
  const forged = Buffer.from(JSON.stringify({ sub: '000000000000000000000000' })).toString('base64url')
  assert.equal(await readSession(cookie(`${header}.${forged}.${signature}`)), null)
})

test('un jeton signé avec un autre secret est refusé', async () => {
  const other = await new SignJWT().setProtectedHeader({ alg: 'HS256' }).setSubject(frameId)
    .sign(new TextEncoder().encode('un-autre-secret-de-plus-de-32-caracteres'))
  assert.equal(await readSession(cookie(other)), null)
})

test('un jeton expiré est refusé', async () => {
  const expired = await new SignJWT().setProtectedHeader({ alg: 'HS256' }).setSubject(frameId)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(new TextEncoder().encode(process.env.JWT_SECRET))
  assert.equal(await readSession(cookie(expired)), null)
})
