import type { MemberListItem } from '@outdoor-fund/shared'
import { request } from '@/utils/http'

export function fetchMembers() {
  return request<MemberListItem[]>({ url: '/members' })
}

export function fetchMember(id: number) {
  return request<{
    memberId: number
    name: string
    nickname: string | null
    avatarUrl: string | null
    phone: string | null
    outdoorTitle: string | null
    hasCar: boolean
    hasLicense: boolean
    experienceLevel: string | null
    notes: string | null
    balance: number
    role: string
    joinedAt: number
  }>({ url: `/members/${id}` })
}

export function addMember(data: {
  name: string
  phone?: string
  nickname?: string
  outdoorTitle?: string
  hasCar?: boolean
  hasLicense?: boolean
  experienceLevel?: string
  notes?: string
}) {
  return request<MemberListItem>({ method: 'POST', url: '/members', data })
}

export function updateMember(id: number, data: {
  name?: string
  phone?: string | null
  nickname?: string | null
  outdoorTitle?: string | null
  hasCar?: boolean
  hasLicense?: boolean
  experienceLevel?: string | null
  notes?: string | null
}) {
  return request({ method: 'PUT', url: `/members/${id}`, data })
}

export function removeMember(id: number) {
  return request({ method: 'DELETE', url: `/members/${id}` })
}

export function topupMember(data: { memberId: number; amount: number; description?: string }) {
  return request<{ transactionId: number; balanceAfter: number }>({
    method: 'POST',
    url: '/topup',
    data,
  })
}

export function updateMemberRole(memberId: number, role: 'admin' | 'member') {
  return request({ method: 'PUT', url: `/members/${memberId}/role`, data: { role } })
}
