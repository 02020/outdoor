import { http } from '@/utils/http'

export interface ImportResult {
  message: string
  routes: { inserted: number; skipped: number; errors: string[] }
  members: { inserted: number; skipped: number; errors: string[] }
}

export async function importExcel(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await http.post<ImportResult>('/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return res.data
}
