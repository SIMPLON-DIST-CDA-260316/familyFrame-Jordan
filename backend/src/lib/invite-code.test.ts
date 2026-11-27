import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInviteCode } from './invite-code.ts'

test('code de 10 caractères sans symbole ambigu', () => {
  for (let i = 0; i < 1000; i++) assert.match(createInviteCode(), /^[2-9A-HJKMNP-TV-Z]{10}$/)
})

test('codes différents à chaque appel', () => {
  const codes = new Set(Array.from({ length: 1000 }, createInviteCode))
  assert.equal(codes.size, 1000)
})
