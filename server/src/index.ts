import cors from 'cors'
import express from 'express'
import { env } from './env.js'
import { adminContentRouter } from './routes/adminContent.js'
import { authRouter } from './routes/auth.js'
import { contentRouter } from './routes/content.js'
import { resourcesRouter } from './routes/resources.js'
import { usersRouter } from './routes/users.js'

const ALLOWED_ORIGINS = [
  /^https:\/\/happygoodday\.vercel\.app$/,
  /^https:\/\/([a-z0-9-]+\.)*kosolution\.net$/,
]

async function main() {
  const app = express()
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) {
          callback(null, true)
          return
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`))
      },
    }),
  )
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use('/api/content', contentRouter)
  app.use('/api/admin/content', adminContentRouter)
  app.use('/api/resources', resourcesRouter)
  app.use('/api/users', usersRouter)

  app.listen(env.port, () => {
    console.log(`HappyDay server listening on port ${env.port}`)
  })
}

main().catch((err: unknown) => {
  console.error('Failed to start server:', err)
  process.exitCode = 1
})
