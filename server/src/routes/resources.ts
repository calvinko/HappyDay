import { Router } from 'express'
import { findResourcesForGroup, findResourcesForUser } from '../models/resource.js'

export const resourcesRouter = Router()

// Express 4 doesn't catch rejections from async handlers, so a failed query
// (e.g. a database that hasn't had sql/migrations applied) would leave the
// request hanging forever. Answer with a 500 instead.
resourcesRouter.get('/group/:groupId', async (req, res) => {
  try {
    res.json(await findResourcesForGroup(req.params.groupId))
  } catch (err) {
    console.error('GET /api/resources/group failed:', err)
    res.status(500).json({ error: 'failed to load resources' })
  }
})

resourcesRouter.get('/user/:userId', async (req, res) => {
  const userId = Number(req.params.userId)
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'userId must be an integer' })
    return
  }

  try {
    res.json(await findResourcesForUser(userId))
  } catch (err) {
    console.error('GET /api/resources/user failed:', err)
    res.status(500).json({ error: 'failed to load resources' })
  }
})
