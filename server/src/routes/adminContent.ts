import { Router, type Request } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import {
  findContentForGroupOnDate,
  findContentForUserOnDate,
  findLatestContentForGroup,
  findLatestContentForUser,
  findUpcomingContentForGroup,
  findUpcomingContentForUser,
  upsertContentForGroup,
  upsertContentForUser,
} from '../models/dailyContent.js'

export const adminContentRouter = Router()
adminContentRouter.use(authenticate, requireAdmin)

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

type Target = { type: 'group'; id: string } | { type: 'user'; id: number }

function parseTarget(targetType: unknown, targetId: unknown): Target | null {
  if (targetType === 'group' && typeof targetId === 'string' && targetId.trim()) {
    return { type: 'group', id: targetId }
  }
  if (targetType === 'user') {
    const id = Number(targetId)
    if (Number.isInteger(id)) return { type: 'user', id }
  }
  return null
}

// groupadmin may only touch their own group's content; appadmin may touch
// any group or user. See CLAUDE.md-level spec: "groupadmin can edit content
// for the group he belongs [to]; appadmin can edit content for any group or user."
function authorizeTarget(req: Request, target: Target): string | null {
  if (req.user!.role === 'appadmin') return null
  if (target.type !== 'group' || target.id !== req.user!.groupId) {
    return 'groupadmin can only edit content for their own group'
  }
  return null
}

// Registered before GET '/' only for readability; paths don't overlap.
adminContentRouter.get('/upcoming', async (req, res) => {
  const target = parseTarget(req.query.targetType, req.query.targetId)
  if (!target) {
    res.status(400).json({ error: 'targetType ("group"|"user") and targetId are required' })
    return
  }

  const authError = authorizeTarget(req, target)
  if (authError) {
    res.status(403).json({ error: authError })
    return
  }

  const items =
    target.type === 'group'
      ? await findUpcomingContentForGroup(target.id)
      : await findUpcomingContentForUser(target.id)
  res.json(items)
})

adminContentRouter.get('/latest', async (req, res) => {
  const target = parseTarget(req.query.targetType, req.query.targetId)
  if (!target) {
    res.status(400).json({ error: 'targetType ("group"|"user") and targetId are required' })
    return
  }

  const authError = authorizeTarget(req, target)
  if (authError) {
    res.status(403).json({ error: authError })
    return
  }

  const content =
    target.type === 'group'
      ? await findLatestContentForGroup(target.id)
      : await findLatestContentForUser(target.id)
  res.json(content)
})

adminContentRouter.get('/', async (req, res) => {
  const { targetType, targetId, date } = req.query
  const target = parseTarget(targetType, targetId)
  if (!target || typeof date !== 'string' || !DATE_RE.test(date)) {
    res.status(400).json({
      error: 'targetType ("group"|"user"), targetId, and date (YYYY-MM-DD) are required',
    })
    return
  }

  const authError = authorizeTarget(req, target)
  if (authError) {
    res.status(403).json({ error: authError })
    return
  }

  const content =
    target.type === 'group'
      ? await findContentForGroupOnDate(target.id, date)
      : await findContentForUserOnDate(target.id, date)
  res.json(content)
})

adminContentRouter.put('/', async (req, res) => {
  const { targetType, targetId, date, passage, song, songUrl, supplementary } =
    req.body ?? {}
  const target = parseTarget(targetType, targetId)
  if (
    !target ||
    typeof date !== 'string' ||
    !DATE_RE.test(date) ||
    typeof passage !== 'string' ||
    passage.trim().length === 0
  ) {
    res.status(400).json({
      error:
        'targetType ("group"|"user"), targetId, date (YYYY-MM-DD), and a non-empty passage are required',
    })
    return
  }

  const authError = authorizeTarget(req, target)
  if (authError) {
    res.status(403).json({ error: authError })
    return
  }

  const fields = {
    passage: passage.trim(),
    song: typeof song === 'string' && song.trim() ? song.trim() : null,
    songUrl: typeof songUrl === 'string' && songUrl.trim() ? songUrl.trim() : null,
    supplementary:
      typeof supplementary === 'string' && supplementary.trim()
        ? supplementary.trim()
        : null,
  }

  if (target.type === 'group') {
    await upsertContentForGroup(target.id, date, fields)
  } else {
    await upsertContentForUser(target.id, date, fields)
  }
  res.status(204).end()
})
