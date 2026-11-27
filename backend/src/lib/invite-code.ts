import { randomInt } from 'node:crypto'

// Ni 0/O, ni 1/I/L, ni U : se recopie sans ambiguïté. 30 symboles × 10 caractères ≈ 49 bits.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
const LENGTH = 10

/** Code d'invitation d'un cadre, tiré avec le générateur aléatoire cryptographique de Node. */
export const createInviteCode = () => Array.from({ length: LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
