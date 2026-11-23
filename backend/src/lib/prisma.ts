import { PrismaClient } from '@prisma/client'

// Une seule instance pour toute l'application (elle gère son propre pool de connexions).
export const prisma = new PrismaClient()
