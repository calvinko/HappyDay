import { Router } from 'express'
import { findUserById, updateFontSize } from '../models/user.js'

export const usersRouter = Router()

// Matches the passage/hymn text size range clamped client-side in
// HappyDayApp.tsx's grow/shrink (15-26px).
const MIN_FONT_SIZE = 15
const MAX_FONT_SIZE = 26

usersRouter.get('/:userId', async (req, res) => {
  const userId = Number(req.params.userId)
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'userId must be an integer' })
    return
  }

  const user = await findUserById(userId)
  if (!user) {
    res.status(404).json({ error: 'no such user' })
    return
  }
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    defaultFontSize: user.defaultFontSize,
  })
})

usersRouter.patch('/:userId/font-size', async (req, res) => {
  const userId = Number(req.params.userId)
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'userId must be an integer' })
    return
  }

  const { fontSize } = req.body ?? {}
  if (
    typeof fontSize !== 'number' ||
    !Number.isInteger(fontSize) ||
    fontSize < MIN_FONT_SIZE ||
    fontSize > MAX_FONT_SIZE
  ) {
    res.status(400).json({
      error: `fontSize must be an integer between ${MIN_FONT_SIZE} and ${MAX_FONT_SIZE}`,
    })
    return
  }

  const user = await findUserById(userId)
  if (!user) {
    res.status(404).json({ error: 'no such user' })
    return
  }

  await updateFontSize(userId, fontSize)
  res.status(204).end()
})
