import type { Request, Response, NextFunction } from 'express'
import { verifyToken, type TokenPayload } from '../utils/token'
import { fail } from '../utils/response'

// 扩展 Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload
    }
  }
}

/** 校验 JWT，提取 groupId + role */
export function authGuard(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    fail(res, '未登录，请先输入群组密码', 401, 401)
    return
  }

  try {
    req.auth = verifyToken(header.slice(7))
    next()
  } catch {
    fail(res, '登录已过期，请重新登录', 401, 401)
  }
}

/** 仅管理员可访问 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== 'admin') {
    fail(res, '仅管理员可执行此操作', 403, 403)
    return
  }
  next()
}
