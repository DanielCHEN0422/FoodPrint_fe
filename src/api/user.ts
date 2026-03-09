import { apiGet, apiPut } from './client'
import type {
    ApiResponse,
    BodyDataRequest,
    UpdateProfileRequest,
    UserProfileDto,
} from './types'

const BASE = 'api/users'

/** GET /api/users/me - 获取当前用户（自动创建） */
export async function getMe(): Promise<ApiResponse<UserProfileDto>> {
    return apiGet<UserProfileDto>(`${BASE}/me`)
}

/** PUT /api/users/me - 更新昵称/头像 */
export async function updateProfile(
    body: UpdateProfileRequest
): Promise<ApiResponse<UserProfileDto>> {
    return apiPut<UserProfileDto>(`${BASE}/me`, body)
}

/** PUT /api/users/me/body-data - 更新身体数据 */
export async function updateBodyData(
    body: BodyDataRequest
): Promise<ApiResponse<UserProfileDto>> {
    return apiPut<UserProfileDto>(`${BASE}/me/body-data`, body)
}
