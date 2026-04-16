import type { Request, Response, NextFunction } from 'express'
import { type ZodSchema, ZodError } from 'zod'
import { fail } from '../utils/response'

/**
 * Zod 校验中间件工厂
 * 用法: router.post('/xxx', validate(schema), handler)
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source])
      // 将解析后的数据回写（确保类型转换生效）
      ;(req as unknown as Record<string, unknown>)[source] = data
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        fail(res, messages.join('; '))
        return
      }
      next(err)
    }
  }
}
