import cors from 'cors'
import express from 'express'
import { env } from './env.js'
import { authRouter } from './routes/auth.js'
import { contentRouter } from './routes/content.js'

async function main() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use('/api/content', contentRouter)

  app.listen(env.port, () => {
    console.log(`HappyDay server listening on port ${env.port}`)
  })
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err)
  process.exitCode = 1
})
