import { Router } from 'express'
import {
  findContentForGroup,
  findContentForUser,
  findContentForUserByName,
} from '../models/dailyContent.js'

export const contentRouter = Router()

contentRouter.get('/group/:groupId', async (req, res) => {
  const content = await findContentForGroup(req.params.groupId)
  if (!content) {
    res.status(404).json({ error: 'no content for this group' })
    return
  }
  res.json(content)
})

// Registered before /user/:userId so "by-name" isn't swallowed as a userId.
contentRouter.get('/user/by-name/:name', async (req, res) => {
  const content = await findContentForUserByName(req.params.name)
  if (!content) {
    res.status(404).json({ error: 'no content for this user' })
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

  const content = await findContentForUser(userId)
  if (!content) {
    res.status(404).json({ error: 'no content for this user' })
    return
  }
  res.json(content)
})
