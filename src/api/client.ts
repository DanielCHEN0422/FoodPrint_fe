import { Platform } from 'react-native'

import { API_BASE_URL } from '../lib/env'
import { getSupabaseAccessToken } from '../lib/supabase'
import type { ApiResponse } from './types'

const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
}

export function getEffectiveBaseUrl(): string {
    const base = API_BASE_URL.replace(/\/$/, '')
    if (Platform.OS === 'android' && (base.includes('localhost') || base.includes('127.0.0.1'))) {
        return base.replace(/localhost|127\.0\.0\.1/, '10.0.2.2')
    }
    return base
}

/**
 * 带 JWT 的请求：自动附加 Authorization: Bearer <supabase_jwt>
 * 用于调用后端 Spring Boot API（OAuth2 Resource Server + JWKS）
 */
export async function apiRequest<T = unknown>(
    path: string,
    options: RequestInit & { skipAuth?: boolean } = {}
): Promise<ApiResponse<T>> {
    const { skipAuth, ...fetchOptions } = options
    const baseUrl = getEffectiveBaseUrl()
    const url = `${baseUrl}/${path.replace(/^\//, '')}`
    const headers: Record<string, string> = {
        ...defaultHeaders,
        ...(typeof fetchOptions.headers === 'object' && !(fetchOptions.headers instanceof Headers)
            ? (fetchOptions.headers as Record<string, string>)
            : {}),
    }

    if (!skipAuth) {
        const token = await getSupabaseAccessToken()
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
    }

    let res: Response
    try {
        res = await fetch(url, {
            ...fetchOptions,
            headers: { ...headers, ...fetchOptions.headers } as HeadersInit,
        })
    } catch (e) {
        const msg =
            e instanceof TypeError && (e.message === 'Network request failed' || e.message === 'Failed to fetch')
                ? 'Network error. Check your connection and that the API server is running (e.g. use your computer’s IP instead of localhost on device).'
                : e instanceof Error
                  ? e.message
                  : 'Network request failed'
        throw new ApiError(0, msg, undefined)
    }

    let body: ApiResponse<T>
    const contentType = res.headers.get('content-type')
    if (contentType?.includes('application/json')) {
        body = (await res.json()) as ApiResponse<T>
    } else {
        const text = await res.text()
        body = {
            code: res.status,
            message: text || res.statusText,
            data: null,
        } as ApiResponse<T>
    }

    if (!res.ok) {
        throw new ApiError(res.status, body.message, body)
    }

    return body
}

/** 便于 GET 请求 */
export function apiGet<T>(path: string, options?: RequestInit) {
    return apiRequest<T>(path, { ...options, method: 'GET' })
}

/** 便于 POST 请求 */
export function apiPost<T>(path: string, body?: unknown, options?: RequestInit) {
    return apiRequest<T>(path, {
        ...options,
        method: 'POST',
        body: body != null ? JSON.stringify(body) : undefined,
    })
}

/** 便于 PUT 请求 */
export function apiPut<T>(path: string, body?: unknown, options?: RequestInit) {
    return apiRequest<T>(path, {
        ...options,
        method: 'PUT',
        body: body != null ? JSON.stringify(body) : undefined,
    })
}

/** 便于 DELETE 请求 */
export function apiDelete<T>(path: string, options?: RequestInit) {
    return apiRequest<T>(path, { ...options, method: 'DELETE' })
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public response?: ApiResponse<unknown>
    ) {
        super(message)
        this.name = 'ApiError'
    }
}
