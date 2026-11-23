import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { processImage } from './image.ts'

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#c0392b' } })

test('un PNG valide ressort en JPEG', async () => {
  const output = await processImage(await solid(100, 80).png().toBuffer())
  const { format, width, height } = await sharp(output).metadata()
  assert.deepEqual({ format, width, height }, { format: 'jpeg', width: 100, height: 80 })
})

test('une grande image est réduite à 1920 px maximum', async () => {
  const output = await processImage(await solid(4000, 3000).jpeg().toBuffer())
  const { width, height } = await sharp(output).metadata()
  assert.deepEqual({ width, height }, { width: 1920, height: 1440 })
})

test('l’orientation EXIF est appliquée puis les métadonnées supprimées', async () => {
  // Orientation 6 = photo prise téléphone tourné : 200x100 stockée, 100x200 affichée
  const input = await solid(200, 100).jpeg().withMetadata({ orientation: 6 }).toBuffer()
  const output = await processImage(input)
  const { width, height, exif, orientation } = await sharp(output).metadata()
  assert.deepEqual({ width, height }, { width: 100, height: 200 })
  assert.equal(exif, undefined)
  assert.equal(orientation, undefined)
})

test('des octets qui ne sont pas une image sont refusés (415)', async () => {
  await assert.rejects(processImage(Buffer.from('<?php echo "pas une image"; ?>')), { status: 415 })
})

test('un JPEG tronqué est refusé (415)', async () => {
  const jpeg = await solid(400, 300).jpeg().toBuffer()
  await assert.rejects(processImage(jpeg.subarray(0, jpeg.length / 2)), { status: 415 })
})

test('un SVG est refusé (415)', async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>')
  await assert.rejects(processImage(svg), { status: 415 })
})

test('une image de plus de 50 mégapixels est refusée avant décodage (413)', async () => {
  const huge = await solid(10_000, 6_000).png({ compressionLevel: 1 }).toBuffer()
  await assert.rejects(processImage(huge), { status: 413 })
})
