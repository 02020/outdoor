import { request } from '@/utils/http'

export interface VehicleItem {
  id: number
  groupId: number
  plateNumber: string
  model: string | null
  ownerId: number | null
  ownerName: string | null
  createdAt: number
}

export function fetchVehicles() {
  return request<VehicleItem[]>({ url: '/vehicles' })
}

export function createVehicle(data: { plateNumber: string; model?: string; ownerId?: number }) {
  return request<any>({ method: 'POST', url: '/vehicles', data })
}

export function updateVehicle(id: number, data: { plateNumber?: string; model?: string | null; ownerId?: number | null }) {
  return request<any>({ method: 'PUT', url: `/vehicles/${id}`, data })
}

export function deleteVehicle(id: number) {
  return request({ method: 'DELETE', url: `/vehicles/${id}` })
}
