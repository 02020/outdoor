import type { Request, Response, NextFunction } from 'express'
import type { ApiResponse } from '@outdoor-fund/shared'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: number = 1,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message)

  if (err instanceof AppError) {
    const body: ApiResponse<null> = {
      code: err.code,
      data: null,
      message: err.message,
    }
    res.status(err.statusCode).json(body)
    return
  }

  const body: ApiResponse<null> = {
    code: -1,
    data: null,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  }
  res.status(500).json(body)
}
