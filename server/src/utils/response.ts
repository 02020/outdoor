import type { Response } from 'express'
import type { ApiResponse } from '@outdoor-fund/shared'

export function ok<T>(res: Response, data: T, message = 'ok') {
  const body: ApiResponse<T> = { code: 0, data, message }
  res.json(body)
}

export function fail(res: Response, message: string, code = 1, status = 400) {
  const body: ApiResponse<null> = { code, data: null, message }
  res.status(status).json(body)
}
