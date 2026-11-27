// Partie 2 : rattache les photos d'avant les cadres (sans frameId) à un cadre « Famille ».
// Idempotent : sans photo orpheline, ne fait rien. Lancé par le service migrate après db push.
import { createInviteCode } from '../src/lib/invite-code.ts'
import { prisma } from '../src/lib/prisma.ts'

// Requêtes MongoDB brutes : frameId étant obligatoire dans le schéma, le client Prisma typé ne sait pas filtrer son absence
const orphans = { frameId: { $exists: false } }

const { n } = (await prisma.$runCommandRaw({ count: 'Photo', query: orphans })) as { n: number }

if (n === 0) {
  console.log('Migration des cadres : aucune photo à rattacher.')
} else {
  const frame = await prisma.frame.create({ data: { name: 'Famille', inviteCode: createInviteCode() } })
  await prisma.$runCommandRaw({
    update: 'Photo',
    updates: [{ q: orphans, u: { $set: { frameId: { $oid: frame.id } } }, multi: true }],
  })
  console.log(`Migration des cadres : ${n} photo(s) rattachée(s) au cadre « Famille », code d'invitation ${frame.inviteCode}`)
}

await prisma.$disconnect()
