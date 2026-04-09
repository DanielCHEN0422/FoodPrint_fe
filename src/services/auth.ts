// src/services/auth.ts
// 这是一个临时的认证服务mock，用于快速测试AI功能
// TODO: 替换为真实的Supabase认证集成

/**
 * 临时mock token，用于测试
 * 在生产环境中，应该从Supabase或其他认证系统获取真实token
 */
export function getMockToken(): string {
    // 返回一个mock token，仅用于开发测试
    // 在真实环境中这应该是有效的JWT
    return 'mock-jwt-token-for-testing';
}

/**
 * 获取用户token（当前为mock实现）
 * TODO: 集成Supabase认证
 */
export async function getUserToken(): Promise<string | null> {
    try {
        // TODO: 实际应用中应该这样获取：
        // const { data: { session } } = await supabaseClient.auth.getSession();
        // return session?.access_token || null;
        
        // 当前返回mock token用于测试
        return getMockToken();
    } catch (error) {
        console.error('Failed to get user token:', error);
        return null;
    }
}

/**
 * 检查用户是否已登录
 */
export async function isUserLoggedIn(): Promise<boolean> {
    const token = await getUserToken();
    return token !== null && token !== 'mock-jwt-token-for-testing';
}

/**
 * 用于开发测试的token验证
 * 生产环境中删除这个函数
 */
export function isDevelopmentMode(): boolean {
    return __DEV__ || process.env.NODE_ENV === 'development';
}