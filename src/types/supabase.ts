/**
 * Supabase 生成的 Database 类型可放在此处
 * 当前仅用 Auth，表结构类型可后续用 supabase gen types 生成后替换
 */
export type Database = {
    public: {
        Tables: Record<string, unknown>
        Views: Record<string, unknown>
        Functions: Record<string, unknown>
        Enums: Record<string, unknown>
    }
}
