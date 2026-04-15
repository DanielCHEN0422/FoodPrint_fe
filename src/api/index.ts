/**
 * FoodPrint 后端 API 封装
 * 认证：所有请求自动携带 Supabase JWT (Authorization: Bearer <token>)
 */

export {
    apiRequest,
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    ApiError,
} from './client'
export * from './user'
export * from './food'
export * from './ai'
export * from './community'
export * from './types'
