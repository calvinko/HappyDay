import { Router } from 'express'
import { findContentForGroup, findContentForUser } from '../models/dailyContent.js'

export const contentRouter = Router()

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function dateParam(req: { query: { date?: unknown } }): string {
  return typeof req.query.date === 'string' ? req.query.date : todayDate()
}

contentRouter.get('/group/:groupId', async (req, res) => {
  const content = await findContentForGroup(req.params.groupId, dateParam(req))
  if (!content) {
    res.status(404).json({ error: 'no content for this group and date' })
    return
  }
  res.json(content)
})

contentRouter.get('/user/:userId', async (req, res) => {
  const userId = Number(req.params.userId)
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'userId must be an integer' })
    return
  }

  const content = await findContentForUser(userId, dateParam(req))
  if (!content) {
    res.status(404).json({ error: 'no content for this user and date' })
    return
  }
  res.json(content)
})
