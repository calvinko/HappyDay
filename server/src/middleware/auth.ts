import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env.js'
import { findUserById, type User } from '../models/user.js'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

// Verifies the Authorization: Bearer <token> header (issued by
// server/src/routes/auth.ts on login/register) and loads the current user
// fresh from the DB on every request, so a role/group change takes effect
// immediately rather than waiting for the token to expire.
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? ''
  const match = /^Bearer (.+)$/.exec(header)
  if (!match) {
    res.status(401).json({ error: 'missing bearer token' })
    return
  }

  let payload: jwt.JwtPayload | string
  try {
    payload = jwt.verify(match[1], env.jwtSecret)
  } catch {
    res.status(401).json({ error: 'invalid or expired token' })
    return
  }

  const userId = typeof payload === 'object' ? Number(payload.sub) : NaN
  const user = Number.isInteger(userId) ? await findUserById(userId) : null
  if (!user) {
    res.status(401).json({ error: 'user not found' })
    return
  }

  req.user = user
  next()
}

// Must run after authenticate. Content editing is restricted to
// groupadmin/appadmin — see server/sql/schema.sql's users.user_role.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'groupadmin' && req.user?.role !== 'appadmin') {
    res.status(403).json({ error: 'admin role required' })
    return
  }
  next()
}
