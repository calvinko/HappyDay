import bcrypt from 'bcrypt'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { createUser, findUserByUsername, touchLastLogin } from '../models/user.js'

const SALT_ROUNDS = 12

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  const { username, password, displayName, groupId } = req.body ?? {}

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof displayName !== 'string' ||
    typeof groupId !== 'string'
  ) {
    res.status(400).json({ error: 'username, password, displayName, and groupId are required' })
    return
  }
  if (
    username.trim().length < 3 ||
    password.length < 8 ||
    displayName.trim().length === 0 ||
    groupId.trim().length === 0
  ) {
    res.status(400).json({
      error:
        'username must be at least 3 characters, password at least 8, displayName non-empty, and groupId non-empty',
    })
    return
  }

  const existing = await findUserByUsername(username.trim())
  if (existing) {
    res.status(409).json({ error: 'username already taken' })
    return
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await createUser(username.trim(), passwordHash, displayName.trim(), groupId.trim())

  const token = jwt.sign({ sub: user.id, username: user.username }, env.jwtSecret, {
    expiresIn: '30d',
  })
  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      defaultFontSize: user.defaultFontSize,
    },
  })
})

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'username and password are required' })
    return
  }

  const user = await findUserByUsername(username.trim())
  if (!user) {
    res.status(401).json({ error: 'invalid username or password' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'invalid username or password' })
    return
  }

  await touchLastLogin(user.id)

  const token = jwt.sign({ sub: user.id, username: user.username }, env.jwtSecret, {
    expiresIn: '30d',
  })
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      defaultFontSize: user.defaultFontSize,
    },
  })
})
