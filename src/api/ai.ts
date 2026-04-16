import { getSupabaseAccessToken } from '../lib/supabase'
import { ApiError, apiPost, getEffectiveBaseUrl } from './client'
import type {
    AIResponseDto,
    AiLogSaveRequest,
    AnalyzeRequest,
    ApiResponse,
    FoodLogDto,
} from './types'

const BASE = 'api/ai'

/** POST /api/ai/analyze - 统一分析（文字/图片 URL） */
export async function analyze(
    body: AnalyzeRequest
): Promise<ApiResponse<AIResponseDto>> {
    return apiPost<AIResponseDto>(`${BASE}/analyze`, body)
}

/**
 * POST /api/ai/log — 一键保存 AI 分析（含用户在表单中修改后的 analysisResult）
 * Header: userId（与 api/food-logs 一致，后端常据此解析归属用户）
 */
export async function saveAiAnalysisLog(
    body: AiLogSaveRequest,
    userId: string
): Promise<ApiResponse<FoodLogDto | null>> {
    return apiPost<FoodLogDto | null>(`${BASE}/log`, body, {
        headers: { userId },
    })
}

/** Web / 已有 Blob 时使用；React Native 相册/相机请用带 `uri` 的对象 */
export type AnalyzeImageNativeFile = {
    uri: string
    name?: string
    type?: string
}

export type AnalyzeImageInput = Blob | AnalyzeImageNativeFile

function isNativePickerFile(x: AnalyzeImageInput): x is AnalyzeImageNativeFile {
    return (
        typeof x === 'object' &&
        x !== null &&
        'uri' in x &&
        typeof (x as AnalyzeImageNativeFile).uri === 'string'
    )
}

/**
 * POST /api/ai/analyze/image - 图片上传分析（multipart/form-data）
 * - Web: 传 `Blob`
 * - React Native: 传 `{ uri, type?, name? }`，勿用 `fetch(fileUri).blob()`（Android 上常失败）
 */
export async function analyzeImage(
    image: AnalyzeImageInput,
    filename = 'image.jpg'
): Promise<ApiResponse<AIResponseDto>> {
    const formData = new FormData()
    if (typeof Blob !== 'undefined' && image instanceof Blob) {
        formData.append('image', image, filename)
    } else if (isNativePickerFile(image)) {
        const name = image.name ?? filename
        const type = image.type ?? 'image/jpeg'
        formData.append('image', {
            uri: image.uri,
            name,
            type,
        } as unknown as Blob)
    } else {
        throw new TypeError(
            'analyzeImage: expected Blob or { uri, name?, type? }'
        )
    }

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
