import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

const isSupabaseConfigured =
    Boolean(SUPABASE_URL && SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.startsWith('https://placeholder') &&
    SUPABASE_ANON_KEY !== 'placeholder-anon-key'

if (!isSupabaseConfigured) {
    console.warn(
        '[FoodPrint] SUPABASE_URL / SUPABASE_ANON_KEY 未配置或为占位值，Supabase 登录与 API 可能失败。请在 .env 中配置 EXPO_PUBLIC_SUPABASE_URL 和 EXPO_PUBLIC_SUPABASE_ANON_KEY。'
    )
}

/** 内存 fallback：当 AsyncStorage 原生模块不可用时使用（如部分 Web/模拟器环境），避免 "Native module is null" 报错 */
const memoryStorage: Record<string, string> = {}
const safeStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key)
        } catch {
            return memoryStorage[key] ?? null
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value)
        } catch {
            memoryStorage[key] = value
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key)
        } catch {
            delete memoryStorage[key]
        }
    },
}

/** Supabase 客户端：Auth + 可选的 Realtime/Storage/PostgREST；使用 safeStorage 避免 AsyncStorage 原生模块不可用时崩溃 */
export const supabase = createClient<Database>(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
        auth: {
            storage: safeStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
)

export { isSupabaseConfigured }

/** 获取当前会话的 access_token（用于后端 API Authorization: Bearer） */
export async function getSupabaseAccessToken(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
        return session.access_token
    }

    const { error } = await supabase.auth.refreshSession()
    if (error) {
        return null
    }

    const {
        data: { session: refreshedSession },
    } = await supabase.auth.getSession()
    return refreshedSession?.access_token ?? null
}
