import jwt from 'jsonwebtoken'
import type { GroupRole } from '@outdoor-fund/shared'

export interface TokenPayload {
  groupId: number
  role: GroupRole
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'change-me-to-a-random-64-char-string') {
    throw new Error('JWT_SECRET 未配置或使用了默认值，请在 .env 中设置')
  }
  return secret
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload
}
