import { request } from '@/utils/http'

export interface RouteItem {
  id: number
  groupId: number
  name: string
  description: string | null
  altitudeM: number | null
  elevationGainM: number | null
  distanceKm: number | null
  driveDistanceKm: number | null
  driveTimeMin: number | null
  waypointsJson: string | null
  createdAt: number
}

export function fetchRoutes() {
  return request<RouteItem[]>({ url: '/routes' })
}

export function fetchRoute(id: number) {
  return request<RouteItem>({ url: `/routes/${id}` })
}

export function createRoute(data: {
  name: string
  description?: string
  regionCode?: string
  difficulty?: number
  routeType?: string
  altitudeM?: number
  elevationGainM?: number
  distanceKm?: number
  driveDistanceKm?: number
  driveTimeMin?: number
  estimatedTimeMin?: number
  bestSeason?: string
  hasWaterSource?: boolean
  hasCellSignal?: boolean
  parkingInfo?: string
  sceneryTags?: string[]
  trackRef?: string
  notes?: string
}) {
  return request<RouteItem>({ method: 'POST', url: '/routes', data })
}

export function updateRoute(id: number, data: Record<string, unknown>) {
  return request<RouteItem>({ method: 'PUT', url: `/routes/${id}`, data })
}

export function deleteRoute(id: number) {
  return request({ method: 'DELETE', url: `/routes/${id}` })
}
