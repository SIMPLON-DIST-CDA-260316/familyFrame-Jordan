import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergePhotos, sized, WALL_SIZE } from './photos.ts'

const photo = (id: string, minute: number) => ({
  id,
  url: `https://res.cloudinary.com/demo/image/upload/v1/familyframe/${id}.jpg`,
  publicId: `familyframe/${id}`,
  pseudo: 'Mamie',
  createdAt: `2026-12-24T10:${String(minute).padStart(2, '0')}:00.000Z`,
})

test('les photos sont triées de la plus récente à la plus ancienne, sans doublon', () => {
  const merged = mergePhotos([photo('a', 1), photo('b', 2)], [photo('c', 3), photo('a', 1)])
  assert.deepEqual(merged.map((p) => p.id), ['c', 'b', 'a'])
})

test('une photo reçue en retard (plus ancienne) ne passe pas devant', () => {
  const merged = mergePhotos([photo('recente', 9)], [photo('ancienne', 5)])
  assert.equal(merged[0].id, 'recente')
})

test(`le mur garde au plus ${WALL_SIZE} photos`, () => {
  const many = Array.from({ length: 20 }, (_, i) => photo(`p${i}`, i))
  const merged = mergePhotos([], many)
  assert.equal(merged.length, WALL_SIZE)
  assert.equal(merged[0].id, 'p19')
})

test('sized insère la transformation Cloudinary dans l’URL', () => {
  assert.equal(
    sized(photo('a', 1).url, 400),
    'https://res.cloudinary.com/demo/image/upload/c_limit,w_400,q_auto,f_auto/v1/familyframe/a.jpg',
  )
})
