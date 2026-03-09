import { getSupabaseAccessToken } from '../lib/supabase'
import { ApiError, apiPost, getEffectiveBaseUrl } from './client'
import type {
    AIResponseDto,
    AnalyzeRequest,
    ApiResponse,
} from './types'

const BASE = 'api/ai'

/** POST /api/ai/analyze - 统一分析（文字/图片 URL） */
export async function analyze(
    body: AnalyzeRequest
): Promise<ApiResponse<AIResponseDto>> {
    return apiPost<AIResponseDto>(`${BASE}/analyze`, body)
}

/**
 * POST /api/ai/analyze/image - 图片上传分析（multipart/form-data）
 * React Native 下 FormData 支持 Blob；若用 base64 需先转 Blob 或由后端支持 base64 端点
 */
export async function analyzeImage(
    imageBlob: Blob,
    filename = 'image.jpg'
): Promise<ApiResponse<AIResponseDto>> {
    const formData = new FormData()
    formData.append('image', imageBlob, filename)

    const token = await getSupabaseAccessToken()
    const url = `${getEffectiveBaseUrl()}/${BASE}/analyze/image`
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
    })

    const data = (await res.json()) as ApiResponse<AIResponseDto>
    if (!res.ok) {
        throw new ApiError(res.status, data.message, data)
    }
    return data
}
