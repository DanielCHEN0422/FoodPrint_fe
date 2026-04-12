import { apiDelete, apiGet, apiPost, apiPut } from './client'
import type {
    ApiResponse,
    CreateFoodLogRequest,
    DailyCalorieBarDto,
    FoodLogDto,
    TodaySummaryDto,
    WeeklyOverviewPayload,
} from './types'

const BASE = 'api/food-logs'

/** 本地日期 YYYY-MM-DD */
export function toYMD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/** 以 end 为窗口最后一天，生成连续 7 天（含）的占位条 */
export function buildLast7DaySlots(end: Date): DailyCalorieBarDto[] {
    const slots: DailyCalorieBarDto[] = []
    for (let i = 6; i >= 0; i--) {
        const x = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)
        slots.push({ date: toYMD(x), totalCalories: 0 })
    }
    return slots
}

function normalizeBarRow(raw: unknown): DailyCalorieBarDto | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const date = String(r.date ?? r.day ?? r.logDate ?? '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
    const c = r.totalCalories ?? r.calories ?? r.total ?? 0
    const totalCalories =
        typeof c === 'number' && !Number.isNaN(c) ? Math.max(0, c) : Math.max(0, Number(c) || 0)
    const num = (k: string) => {
        const v = r[k]
        if (typeof v === 'number' && !Number.isNaN(v)) return v
        const n = Number(v)
        return Number.isFinite(n) ? n : undefined
    }
    return {
        date,
        totalCalories,
        totalProtein: num('totalProtein'),
        totalFat: num('totalFat'),
        totalCarbs: num('totalCarbs'),
        logCount: typeof r.logCount === 'number' ? r.logCount : Number(r.logCount) || undefined,
    }
}

/** 解析 weekly-overview 响应体（兼容多种后端形状） */
export function parseWeeklyOverviewPayload(payload: unknown): DailyCalorieBarDto[] {
    if (payload == null) return []
    if (Array.isArray(payload)) {
        return payload.map(normalizeBarRow).filter((x): x is DailyCalorieBarDto => x != null)
    }
    if (typeof payload === 'object') {
        const o = payload as Record<string, unknown>
        const arr = o.days ?? o.dailyTotals ?? o.items ?? o.bars ?? o.data
        if (Array.isArray(arr)) {
            return arr.map(normalizeBarRow).filter((x): x is DailyCalorieBarDto => x != null)
        }
    }
    return []
}

/** 将接口返回合并进 7 天槽位（按 date 对齐） */
export function mergeWeeklyIntoSlots(
    slots: DailyCalorieBarDto[],
    fromApi: DailyCalorieBarDto[]
): DailyCalorieBarDto[] {
    const map = new Map(fromApi.map((x) => [x.date, x]))
    return slots.map((s) => {
        const hit = map.get(s.date)
        return hit ? { ...s, ...hit } : s
    })
}

/** GET /api/food-logs/weekly-overview?endDate=YYYY-MM-DD */
export async function getWeeklyOverview(
    endDate?: string
): Promise<ApiResponse<WeeklyOverviewPayload>> {
    const q = endDate ? `?endDate=${encodeURIComponent(endDate)}` : ''
    return apiGet<WeeklyOverviewPayload>(`${BASE}/weekly-overview${q}`)
}

/** POST /api/food-logs - 创建食物记录（调用 AI） */
export async function createFoodLog(
    body: CreateFoodLogRequest
): Promise<ApiResponse<FoodLogDto>> {
    return apiPost<FoodLogDto>(BASE, body)
}

/** GET /api/food-logs?date=YYYY-MM-DD - 按日期查询（后端 TODO 时可能 404） */
export async function getFoodLogsByDate(
    date: string
): Promise<ApiResponse<FoodLogDto[]>> {
    return apiGet<FoodLogDto[]>(`${BASE}?date=${encodeURIComponent(date)}`)
}

/** GET /api/food-logs/today/summary - 今日营养汇总（后端 TODO 时可能 404） */
export async function getTodaySummary(): Promise<
    ApiResponse<TodaySummaryDto>
> {
    return apiGet<TodaySummaryDto>(`${BASE}/today/summary`)
}

/** PUT /api/food-logs/:id - 修改记录（后端 TODO 时可能 404） */
export async function updateFoodLog(
    id: string,
    body: Partial<CreateFoodLogRequest>
): Promise<ApiResponse<FoodLogDto>> {
    return apiPut<FoodLogDto>(`${BASE}/${id}`, body)
}

/** DELETE /api/food-logs/:id - 删除记录（后端 TODO 时可能 404） */
export async function deleteFoodLog(
    id: string
): Promise<ApiResponse<unknown>> {
    return apiDelete(`${BASE}/${id}`)
}
