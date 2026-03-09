/**
 * 环境变量配置
 * Expo 会从项目根目录 .env 加载到 process.env（需配合 app.config.js 或 babel-plugin 使用）
 * 开发时也可在运行前 source .env 或使用 EAS/本地 .env
 */
const getEnv = (key: string, fallback = ''): string => {
    if (typeof process !== 'undefined' && process.env?.[key] != null) {
        return String(process.env[key]).trim()
    }
    return fallback
}

/** Supabase 项目 URL，来自 Supabase Dashboard → Settings → API */
export const SUPABASE_URL =
    getEnv('EXPO_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL', '')

/** Supabase 匿名 Key（公开，用于客户端 Auth） */
export const SUPABASE_ANON_KEY =
    getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY', '')

/** 后端 API 根地址（Spring Boot 服务） */
export const API_BASE_URL =
    getEnv('EXPO_PUBLIC_API_BASE_URL') ||
    getEnv('API_BASE_URL', 'http://localhost:8080')
