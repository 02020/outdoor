import type { DataTableColumn } from 'naive-ui'
import type { MemberListItem } from '@outdoor-fund/shared'
import { GroupRole } from '@outdoor-fund/shared'
import { h } from 'vue'
import { NTag, NButton } from 'naive-ui'

export interface MemberColumnContext {
  isAdmin: boolean
  onTopup: (row: MemberListItem) => void
  onDetail: (row: MemberListItem) => void
}

export function createMemberColumns(ctx: MemberColumnContext): DataTableColumn<MemberListItem>[] {
  const columns: DataTableColumn<MemberListItem>[] = [
    {
      title: '姓名',
      key: 'name',
      width: 80,
      fixed: 'left',
    },
    {
      title: '角色',
      key: 'role',
      width: 72,
      render: (row) =>
        h(NTag, { size: 'small', type: row.role === 'admin' ? 'warning' : 'default' }, () => GroupRole[row.role]),
    },
    {
      title: '余额',
      key: 'balance',
      width: 90,
      render: (row) =>
        h('span', { class: row.balance < 0 ? 'text-red-500' : 'text-green-600' }, `¥${row.balance.toFixed(2)}`),
    },
    {
      title: '活动次数',
      key: 'activityCount',
      width: 80,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (row) => {
        const btns = [
          h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => ctx.onDetail(row) }, () => '详情'),
        ]
        if (ctx.isAdmin) {
          btns.push(
            h(NButton, { text: true, type: 'success', size: 'small', onClick: () => ctx.onTopup(row) }, () => '充值'),
          )
        }
        return h('div', { class: 'flex gap-2' }, btns)
      },
    },
  ]
  return columns
}
