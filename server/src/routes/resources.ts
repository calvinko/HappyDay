import { Router } from 'express'
import { findResourcesForGroup, findResourcesForUser } from '../models/resource.js'

export const resourcesRouter = Router()

resourcesRouter.get('/group/:groupId', async (req, res) => {
  res.json(await findResourcesForGroup(req.params.groupId))
})

resourcesRouter.get('/user/:userId', async (req, res) => {
  const userId = Number(req.params.userId)
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'userId must be an integer' })
    return
  }

  res.json(await findResourcesForUser(userId))
})
