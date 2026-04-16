import { request } from '@/utils/http'
import type { Activity } from '@outdoor-fund/shared'

export function fetchActivities() {
  return request<Activity[]>({ url: '/activities' })
}

export function fetchActivityDetail(id: number) {
  return request<{
    activity: Activity
    members: any[]
    expenses: any[]
    settlements: any[]
  }>({ url: `/activities/${id}` })
}

export function createActivity(data: {
  name: string
  date: string
  location?: string
  routeId?: number
  splitMode?: string
  reimburseMode?: string
  notes?: string
}) {
  return request<Activity>({ method: 'POST', url: '/activities', data })
}

export function updateActivity(id: number, data: Record<string, unknown>) {
  return request<Activity>({ method: 'PUT', url: `/activities/${id}`, data })
}

export function deleteActivity(id: number) {
  return request({ method: 'DELETE', url: `/activities/${id}` })
}

export function setActivityMembers(activityId: number, members: { memberId: number; hangerOnCount: number; vehicleId?: number }[]) {
  return request({ method: 'PUT', url: `/activities/${activityId}/members`, data: { members } })
}

export function addExpense(activityId: number, data: {
  category: string
  amount: number
  payerId: number
  description?: string
  isVehicleCost?: boolean
  vehicleId?: number
}) {
  return request({ method: 'POST', url: `/activities/${activityId}/expenses`, data })
}

export function deleteExpense(activityId: number, expenseId: number) {
  return request({ method: 'DELETE', url: `/activities/${activityId}/expenses/${expenseId}` })
}

export function previewSettlement(activityId: number) {
  return request<any>({ url: `/activities/${activityId}/settlement/preview` })
}

export function confirmSettlement(activityId: number) {
  return request<any>({ method: 'POST', url: `/activities/${activityId}/settlement/confirm` })
}

export function reverseSettlement(activityId: number) {
  return request<any>({ method: 'POST', url: `/activities/${activityId}/settlement/reverse` })
}
