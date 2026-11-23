import { createServer } from 'node:http'
import express, { type ErrorRequestHandler } from 'express'
import { io } from './lib/socket.ts'
import { photosRouter } from './routes/photos.ts'

const port = Number(process.env.PORT ?? 3000)

const app = express()
app.disable('x-powered-by')

app.use('/api/photos', photosRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable.' })
})

// Express 5 transmet aussi ici les erreurs des handlers async (promesses rejetées).
const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err)
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 ? err.status : 500
  if (status === 500) console.error(err)
  // Le détail des erreurs internes reste dans les logs, jamais dans la réponse
  res.status(status).json({ error: status === 500 ? 'Erreur interne du serveur.' : err.message })
}
app.use(errorHandler)

// Un seul serveur HTTP pour l'API Express et Socket.IO (même port).
const server = createServer(app)
io.attach(server)
server.listen(port, () => {
  console.log(`API prête sur http://localhost:${port}`)
})
