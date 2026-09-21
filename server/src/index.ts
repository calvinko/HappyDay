import cors from 'cors'
import express from 'express'
import { initDb } from './db/init.js'
import { env } from './env.js'
import { authRouter } from './routes/auth.js'

async function main() {
  await initDb()

  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/auth', authRouter)

  app.listen(env.port, () => {
    console.log(`HappyDay server listening on port ${env.port}`)
  })
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err)
  process.exitCode = 1
})
