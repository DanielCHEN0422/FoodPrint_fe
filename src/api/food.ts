import { apiDelete, apiGet, apiPost, apiPut } from './client'
import type {
    ApiResponse,
    CreateFoodLogRequest,
    FoodLogDto,
    TodaySummaryDto,
} from './types'

const BASE = 'api/food-logs'

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
