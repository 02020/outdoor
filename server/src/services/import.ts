import * as XLSX from 'xlsx'
import { db, sqlite } from '../db/connection'
import { routes, members, groupMembers } from '../db/schema/index'
import { eq, and } from 'drizzle-orm'
import type { ExperienceLevel } from '@outdoor-fund/shared'

/** 城市名 → 行政区划代码 */
const cityToRegionCode: Record<string, string> = {
  '福州市': '350100', '福州': '350100',
  '厦门市': '350200', '厦门': '350200',
  '莆田市': '350300', '莆田': '350300',
  '三明市': '350400', '三明': '350400',
  '泉州市': '350500', '泉州': '350500',
  '漳州市': '350600', '漳州': '350600',
  '南平市': '350700', '南平': '350700',
  '龙岩市': '350800', '龙岩': '350800',
  '宁德市': '350900', '宁德': '350900',
}

/** 经验等级中文 → enum key */
const expLevelMap: Record<string, string> = {
  '新手': 'beginner',
  '入门': 'elementary',
  '进阶': 'intermediate',
  '资深': 'senior',
}

/** 难度星星 → 数字 */
function parseDifficulty(val: string | undefined | null): number | null {
  if (!val) return null
  const stars = (val.match(/⭐/g) || []).length
  return stars > 0 ? stars : null
}

/** 提取数字，如 "约5km" → 5, "920m+" → 920, "1811.4米" → 1811.4 */
function parseNumber(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null || val === '') return null
  if (typeof val === 'number') return val
  const m = String(val).match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : null
}

/** 车程时间转分钟: "3h10m" → 190, "50m" → 50, "1h" → 60 */
function parseDriveTime(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null || val === '') return null
  const s = String(val)
  const hMatch = s.match(/([\d.]+)\s*h/i)
  const mMatch = s.match(/([\d.]+)\s*m/i)
  const hours = hMatch ? parseFloat(hMatch[1]) : 0
  const mins = mMatch ? parseFloat(mMatch[1]) : 0
  const total = hours * 60 + mins
  return total > 0 ? Math.round(total) : null
}

interface ImportResult {
  routes: { inserted: number; skipped: number; errors: string[] }
  members: { inserted: number; skipped: number; errors: string[] }
}

export function importFromExcel(groupId: number, buffer: Buffer): ImportResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const result: ImportResult = {
    routes: { inserted: 0, skipped: 0, errors: [] },
    members: { inserted: 0, skipped: 0, errors: [] },
  }

  // ─── 导入路线 ───
  const routeSheet = workbook.Sheets['路线']
  if (routeSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(routeSheet)
    const now = Date.now()

    sqlite.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const name = String(row['路线名称'] || '').trim()
        if (!name) {
          result.routes.errors.push(`第${i + 2}行: 路线名称为空，跳过`)
          result.routes.skipped++
          continue
        }

        // 检查是否已存在同名路线
        const existing = db.select().from(routes)
          .where(and(eq(routes.groupId, groupId), eq(routes.name, name)))
          .get()
        if (existing) {
          result.routes.skipped++
          continue
        }

        const city = String(row['市区'] || '').trim()

        db.insert(routes).values({
          groupId,
          name,
          description: row['亮点'] ? String(row['亮点']).trim() : null,
          regionCode: cityToRegionCode[city] || null,
          difficulty: parseDifficulty(row['难度']),
          altitudeM: parseNumber(row['海拔']),
          elevationGainM: parseNumber(row['爬升']),
          distanceKm: parseNumber(row['距离']),
          driveDistanceKm: parseNumber(row['车程距离（km）']),
          driveTimeMin: parseDriveTime(row['车程时间']),
          notes: row['备注'] ? String(row['备注']).trim() : null,
          trackRef: row['参考轨迹'] ? String(row['参考轨迹']).trim() : null,
          createdAt: now,
        }).run()
        result.routes.inserted++
      }
    })()
  }

  // ─── 导入成员 ───
  const memberSheet = workbook.Sheets['成员']
  if (memberSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(memberSheet)
    const now = Date.now()

    sqlite.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const name = String(row['姓名'] || '').trim()
        if (!name) {
          result.members.errors.push(`第${i + 2}行: 姓名为空，跳过`)
          result.members.skipped++
          continue
        }

        // 查找或创建 member
        let member = db.select().from(members).where(eq(members.name, name)).get()
        if (!member) {
          const nickname = row['昵称'] ? String(row['昵称']).trim() : null
          const phone = row['手机号'] ? String(row['手机号']).trim() : null
          const outdoorTitle = row['户外昵称'] ? String(row['户外昵称']).trim() : null
          const expRaw = row['户外经验'] ? String(row['户外经验']).trim() : null
          const experienceLevel = (expRaw ? (expLevelMap[expRaw] || null) : null) as ExperienceLevel | null
          const hasCar = row['有车'] === 1 || row['有车'] === '1' || row['有车'] === true

          member = db.insert(members).values({
            name,
            nickname,
            phone,
            outdoorTitle,
            experienceLevel,
            hasCar,
            hasLicense: false,
            createdAt: now,
          }).returning().get()
        }

        // 检查是否已在群组中
        const existing = db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, member.id)))
          .get()
        if (existing) {
          result.members.skipped++
          continue
        }

        db.insert(groupMembers).values({
          groupId,
          memberId: member.id,
          balance: 0,
          role: 'member',
          joinedAt: now,
        }).run()
        result.members.inserted++
      }
    })()
  }

  return result
}
