import { apiDelete, apiGet, apiPost, apiPut } from './client'
import type {
    ApiResponse,
    CreateFoodLogRequest,
    DailyCalorieBarDto,
    FoodLogDto,
    ManualFoodLogRequest,
    TodayFoodLogItemDto,
    TodaySummaryDto,
    WeeklyOverviewPayload,
} from './types'

const BASE = 'api/food-logs'

/** 本地日期 YYYY-MM-DD（设备系统时区） */
export function toYMD(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/** 系统本地日历：给定 YYYY-MM-DD，返回前一天 */
export function prevLocalDayYmd(ymd: string): string {
    const [y, mo, d] = ymd.split('-').map(Number)
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return ymd
    const dt = new Date(y, mo - 1, d - 1)
    return toYMD(dt)
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
    const c =
        r.totalCalories ??
        r.calories ??
        r.calorie ??
        r.total ??
        r.total_calories ??
        0
    const totalCalories =
        typeof c === 'number' && !Number.isNaN(c)
            ? Math.max(0, c)
            : Math.max(0, Number(c) || 0)
    const num = (...keys: string[]) => {
        for (const k of keys) {
            const v = r[k]
            if (typeof v === 'number' && !Number.isNaN(v)) return v
            const n = Number(v)
            if (Number.isFinite(n)) return n
        }
        return undefined
    }
    return {
        date,
        totalCalories,
        totalProtein: num(
            'totalProtein',
            'total_protein',
            'totalProteinG',
            'proteinG',
            'protein_g',
            'protein'
        ),
        totalFat: num(
            'totalFat',
            'total_fat',
            'totalFatG',
            'fatG',
            'fat_g',
            'fat'
        ),
        totalCarbs: num(
            'totalCarbs',
            'total_carbs',
            'totalCarbsG',
            'carbsG',
            'carbs_g',
            'carbs',
            'carbohydrates'
        ),
        logCount:
            typeof r.logCount === 'number'
                ? r.logCount
                : Number(r.logCount) || undefined,
    }
}

const WEEKLY_DAY_ARRAY_KEYS = [
    'days',
    'dailyTotals',
    'items',
    'bars',
] as const

function extractWeeklyDayRows(payload: Record<string, unknown>): unknown[] {
    for (const k of WEEKLY_DAY_ARRAY_KEYS) {
        const v = payload[k]
        if (Array.isArray(v)) return v
    }
    const inner = payload.data
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const d = inner as Record<string, unknown>
        for (const k of WEEKLY_DAY_ARRAY_KEYS) {
            const v = d[k]
            if (Array.isArray(v)) return v
        }
    }
    if (Array.isArray(payload.data)) return payload.data
    return []
}

/** 解析 weekly-overview 的 data（如 `{ days: [{ date, calories, protein, fat, carbs }] }`） */
export function parseWeeklyOverviewPayload(
    payload: unknown
): DailyCalorieBarDto[] {
    if (payload == null) return []
    if (Array.isArray(payload)) {
        return payload
            .map(normalizeBarRow)
            .filter((x): x is DailyCalorieBarDto => x != null)
    }
    if (typeof payload === 'object') {
        const arr = extractWeeklyDayRows(payload as Record<string, unknown>)
        if (arr.length > 0) {
            return arr
                .map(normalizeBarRow)
                .filter((x): x is DailyCalorieBarDto => x != null)
        }
    }
    return []
}

/** nutritionData 等字段可能是 JSON 字符串 */
function asObjectRecord(v: unknown): Record<string, unknown> | null {
    if (v == null) return null
    if (typeof v === 'string') {
        const t = v.trim()
        if (!t.startsWith('{') && !t.startsWith('[')) return null
        try {
            const j = JSON.parse(t) as unknown
            if (j && typeof j === 'object' && !Array.isArray(j))
                return j as Record<string, unknown>
        } catch {
            return null
        }
        return null
    }
    if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
    return null
}

function macroPickMulti(
    r: Record<string, unknown>,
    keys: string[],
    nestedList: Record<string, unknown>[]
): number | undefined {
    for (const k of keys) {
        for (const src of [r, ...nestedList]) {
            const v = src[k]
            if (typeof v === 'number' && !Number.isNaN(v)) return v
            const n = Number(v)
            if (Number.isFinite(n)) return n
        }
    }
    return undefined
}

/** nutrition / analysisResult.summary 等与 AI 保存字段名对齐 */
function todayNestedMacroSources(r: Record<string, unknown>): Record<
    string,
    unknown
>[] {
    const list: Record<string, unknown>[] = []
    const pushRec = (o: unknown) => {
        const rec = asObjectRecord(o)
        if (rec) list.push(rec)
    }
    pushRec(r.nutritionData)
    pushRec(r.nutrition)
    pushRec(r.macros)
    pushRec(r.macroNutrients)
    pushRec(r.macro_nutrients)
    pushRec(r.mealTotals)
    pushRec(r.totals)
    const ar = r.analysisResult ?? r.analysis_result
    if (ar && typeof ar === 'object') {
        const arObj = ar as Record<string, unknown>
        pushRec(arObj.summary ?? arObj.mealSummary)
        pushRec(arObj)
    }
    return list
}

function sumMacrosFromFoodsArray(foods: unknown): {
    protein: number
    fat: number
    carbs: number
} | null {
    if (!Array.isArray(foods) || foods.length === 0) return null
    let protein = 0
    let fat = 0
    let carbs = 0
    for (const row of foods) {
        if (!row || typeof row !== 'object') continue
        const o = row as Record<string, unknown>
        protein +=
            Number(
                o.proteinG ??
                    o.protein ??
                    o.totalProtein ??
                    o.totalProteinG ??
                    o.proteinGrams ??
                    0
            ) || 0
        fat +=
            Number(o.fatG ?? o.fat ?? o.totalFat ?? o.totalFatG ?? o.fatGrams ?? 0) ||
            0
        carbs +=
            Number(
                o.carbsG ??
                    o.carbs ??
                    o.totalCarbs ??
                    o.totalCarbsG ??
                    o.carbohydrates ??
                    o.carbohydrateGrams ??
                    0
            ) || 0
    }
    return { protein, fat, carbs }
}

function normalizeTodayFoodLogItem(raw: unknown): TodayFoodLogItemDto | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const idRaw = r.id
    const id =
        typeof idRaw === 'string'
            ? idRaw.trim()
            : idRaw != null
              ? String(idRaw).trim()
              : ''
    if (!id) return null
    const title = typeof r.title === 'string' ? r.title : ''
    let foodItems: string[] = []
    if (Array.isArray(r.foodItems)) {
        foodItems = r.foodItems.filter((x): x is string => typeof x === 'string')
    }
    const tc = r.totalCalories ?? r.calories ?? 0
    const totalCalories =
        typeof tc === 'number' && !Number.isNaN(tc)
            ? Math.round(tc)
            : Math.round(Number(tc) || 0)
    const mt = r.mealTime ?? r.createdAt ?? r.logDate
    const mealTime =
        typeof mt === 'string' && mt ? mt : new Date().toISOString()

    const nestedList = todayNestedMacroSources(r)

    const roundOpt = (x: number | undefined): number | undefined =>
        x === undefined ? undefined : Math.round(x)

    let totalProtein = roundOpt(
        macroPickMulti(
            r,
            [
                'totalProtein',
                'total_protein',
                'totalProteinG',
                'proteinG',
                'protein_g',
                'protein',
            ],
            nestedList
        )
    )
    let totalFat = roundOpt(
        macroPickMulti(
            r,
            ['totalFat', 'total_fat', 'totalFatG', 'fatG', 'fat_g', 'fat'],
            nestedList
        )
    )
    let totalCarbs = roundOpt(
        macroPickMulti(
            r,
            [
                'totalCarbs',
                'total_carbs',
                'totalCarbsG',
                'carbsG',
                'carbs_g',
                'carbs',
                'carbohydrates',
                'carbohydrate',
            ],
            nestedList
        )
    )

    const mergeFoodSums = (
        a: { protein: number; fat: number; carbs: number } | null,
        b: { protein: number; fat: number; carbs: number } | null
    ) => {
        if (!a && !b) return null
        return {
            protein: (a?.protein ?? 0) + (b?.protein ?? 0),
            fat: (a?.fat ?? 0) + (b?.fat ?? 0),
            carbs: (a?.carbs ?? 0) + (b?.carbs ?? 0),
        }
    }

    const ar = r.analysisResult ?? r.analysis_result
    let fromNestedFoods = null as ReturnType<typeof sumMacrosFromFoodsArray>
    if (ar && typeof ar === 'object') {
        fromNestedFoods = sumMacrosFromFoodsArray(
            (ar as Record<string, unknown>).foods
        )
    }
    const fromRootFoods = sumMacrosFromFoodsArray(r.foods)
    let fromFoods = mergeFoodSums(fromNestedFoods, fromRootFoods)
    const foodItemsRaw = r.foodItems
    if (
        Array.isArray(foodItemsRaw) &&
        foodItemsRaw.length > 0 &&
        typeof foodItemsRaw[0] === 'object'
    ) {
        fromFoods = mergeFoodSums(
            fromFoods,
            sumMacrosFromFoodsArray(foodItemsRaw)
        )
    }
    if (fromFoods && (fromFoods.protein > 0 || fromFoods.fat > 0 || fromFoods.carbs > 0)) {
        if (totalProtein === undefined)
            totalProtein = roundOpt(fromFoods.protein)
        if (totalFat === undefined) totalFat = roundOpt(fromFoods.fat)
        if (totalCarbs === undefined) totalCarbs = roundOpt(fromFoods.carbs)
    }

    const out: TodayFoodLogItemDto = {
        id,
        title: title || 'Meal',
        foodItems:
            foodItems.length > 0 ? foodItems : title ? [title] : ['Meal'],
        totalCalories,
        mealTime,
    }
    if (totalProtein !== undefined) out.totalProtein = totalProtein
    if (totalFat !== undefined) out.totalFat = totalFat
    if (totalCarbs !== undefined) out.totalCarbs = totalCarbs
    return out
}

/** 解析 GET /food-logs/today 的 data（裸数组或 { logs|items|meals|data }） */
export function parseTodayFoodLogsPayload(
    payload: unknown
): TodayFoodLogItemDto[] {
    if (payload == null) return []
    if (Array.isArray(payload)) {
        return payload
            .map(normalizeTodayFoodLogItem)
            .filter((x): x is TodayFoodLogItemDto => x != null)
    }
    if (typeof payload === 'object') {
        const o = payload as Record<string, unknown>
        const arr = o.logs ?? o.items ?? o.meals ?? o.data
        if (Array.isArray(arr)) {
            return arr
                .map(normalizeTodayFoodLogItem)
                .filter((x): x is TodayFoodLogItemDto => x != null)
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

/**
 * 把 GET /food-logs/today 汇总写入周数组中 **系统本地「今天」**（`todayYmd`）那一格。
 * 全部按设备本地日历对齐，不做跨任意日的「捐赠」宏量拷贝（易与后端 UTC 错位叠成两天同数）。
 *
 * 若周概览把同一批摄入落在「本地昨天」、本地今天柱近空，则与 /today 汇总同值的 **仅昨天** 一栏清零，减轻时区错位造成的重复柱。
 */
export function mergeTodayLogsIntoWeeklyTodayBar(
    weekly: DailyCalorieBarDto[],
    logs: TodayFoodLogItemDto[],
    todayYmd: string
): DailyCalorieBarDto[] {
    if (!weekly.length) return weekly
    let sumCal = 0
    let sumP = 0
    let sumF = 0
    let sumC = 0
    for (const log of logs) {
        sumCal += Number(log.totalCalories) || 0
        sumP += log.totalProtein ?? 0
        sumF += log.totalFat ?? 0
        sumC += log.totalCarbs ?? 0
    }
    const hasCalsFromLogs = sumCal > 0.01
    const hasMacrosFromLogs = sumP + sumF + sumC > 0.01
    if (!hasCalsFromLogs && !hasMacrosFromLogs) return weekly

    const todayBefore = weekly.find((b) => b.date === todayYmd)
    const todayApiCal = Math.round(Number(todayBefore?.totalCalories) || 0)

    let merged = weekly.map((bar) => {
        if (bar.date !== todayYmd) return bar
        return {
            ...bar,
            totalCalories: hasCalsFromLogs
                ? Math.max(0, Math.round(sumCal))
                : bar.totalCalories,
            ...(hasMacrosFromLogs
                ? {
                      totalProtein: Math.round(sumP),
                      totalFat: Math.round(sumF),
                      totalCarbs: Math.round(sumC),
                  }
                : {}),
        }
    })

    if (hasCalsFromLogs && todayApiCal <= 2) {
        const prevYmd = prevLocalDayYmd(todayYmd)
        const target = Math.round(sumCal)
        merged = merged.map((bar) => {
            if (bar.date !== prevYmd) return bar
            const prevCal = Math.round(Number(bar.totalCalories) || 0)
            if (prevCal !== target) return bar
            return {
                ...bar,
                totalCalories: 0,
                totalProtein: 0,
                totalFat: 0,
                totalCarbs: 0,
            }
        })
    }

    return merged
}

/**
 * GET /api/food-logs/weekly-overview?endDate=YYYY-MM-DD
 * Header: userId（Supabase auth user id，与 createFoodLog 一致）
 */
export async function getWeeklyOverview(
    userId: string,
    endDate?: string
): Promise<ApiResponse<WeeklyOverviewPayload>> {
    const q = endDate ? `?endDate=${encodeURIComponent(endDate)}` : ''
    const path = `${BASE}/weekly-overview${q}`
    const res = await apiGet<WeeklyOverviewPayload>(path, {
        headers: { userId },
    })
    return res
}

/**
 * POST /api/food-logs — 创建食物记录（纯 CRUD；营养字段由前端在 AI 分析后填入）
 * Header: userId（Supabase auth user id，与 JWT sub 一致）
 */
export async function createFoodLog(
    body: CreateFoodLogRequest,
    userId: string
): Promise<ApiResponse<FoodLogDto>> {
    return apiPost<FoodLogDto>(BASE, body, {
        headers: { userId },
    })
}

/**
 * POST /api/food-logs/manual — 纯手动录入（无 AI）
 * Header: userId（与 weekly-overview 一致）
 */
export async function createManualFoodLog(
    body: ManualFoodLogRequest,
    userId: string
): Promise<ApiResponse<FoodLogDto | null>> {
    return apiPost<FoodLogDto | null>(`${BASE}/manual`, body, {
        headers: { userId },
    })
}

/**
 * GET /api/food-logs?date=YYYY-MM-DD - 按日期查询
 * Header: userId（与 weekly-overview / create 一致）
 */
export async function getFoodLogsByDate(
    userId: string,
    date: string
): Promise<ApiResponse<FoodLogDto[]>> {
    return apiGet<FoodLogDto[]>(`${BASE}?date=${encodeURIComponent(date)}`, {
        headers: { userId },
    })
}

/**
 * GET /api/food-logs/today — Home 当日餐次简化列表
 * Header: userId（与其它 food-logs 一致）
 */
export async function getFoodLogsToday(
    userId: string
): Promise<ApiResponse<TodayFoodLogItemDto[]>> {
    return apiGet<TodayFoodLogItemDto[]>(`${BASE}/today`, {
        headers: { userId },
    })
}

/** GET /api/food-logs/today/summary - 今日营养汇总（后端 TODO 时可能 404） */
export async function getTodaySummary(): Promise<ApiResponse<TodaySummaryDto>> {
    return apiGet<TodaySummaryDto>(`${BASE}/today/summary`)
}

/** PUT /api/food-logs/:id - 修改记录（后端 TODO 时可能 404） */
export async function updateFoodLog(
    id: string,
    body: Partial<CreateFoodLogRequest>,
    userId?: string
): Promise<ApiResponse<FoodLogDto>> {
    return apiPut<FoodLogDto>(`${BASE}/${id}`, body, {
        headers: userId ? { userId } : undefined,
    })
}

/** DELETE /api/food-logs/:id - 删除记录（后端 TODO 时可能 404） */
export async function deleteFoodLog(
    id: string,
    userId?: string
): Promise<ApiResponse<unknown>> {
    return apiDelete(`${BASE}/${id}`, {
        headers: userId ? { userId } : undefined,
    })
}
