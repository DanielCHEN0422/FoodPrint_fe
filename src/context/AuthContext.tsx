import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'

type AuthActionResult = {
    success: boolean
    message?: string
}

type AuthContextValue = {
    isAuthenticated: boolean
    isLoading: boolean
    userEmail: string | null
    login: (email: string, password: string) => Promise<AuthActionResult>
    register: (email: string, password: string) => Promise<AuthActionResult>
    logout: () => Promise<void>
}

type StoredUser = {
    email: string
    password: string
}

type StoredSession = {
    email: string
}

const AUTH_USER_KEY = '@foodprint/auth_user'
const AUTH_SESSION_KEY = '@foodprint/auth_session'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
    const [isLoading, setIsLoading] = useState(true)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        async function restoreSession() {
            try {
                const sessionRaw = await AsyncStorage.getItem(AUTH_SESSION_KEY)
                if (!sessionRaw) {
                    return
                }

                const session = JSON.parse(sessionRaw) as StoredSession
                if (session.email) {
                    setUserEmail(session.email)
                }
            } catch {
                await AsyncStorage.removeItem(AUTH_SESSION_KEY)
                setUserEmail(null)
            } finally {
                setIsLoading(false)
            }
        }

        void restoreSession()
    }, [])

    const login = useCallback(
        async (email: string, password: string): Promise<AuthActionResult> => {
            const normalizedEmail = email.trim().toLowerCase()
            if (!normalizedEmail || !password) {
                return {
                    success: false,
                    message: '请输入邮箱和密码',
                }
            }

            try {
                const userRaw = await AsyncStorage.getItem(AUTH_USER_KEY)
                if (!userRaw) {
                    return {
                        success: false,
                        message: '用户不存在，请先注册',
                    }
                }

                const user = JSON.parse(userRaw) as StoredUser
                if (
                    user.email !== normalizedEmail ||
                    user.password !== password
                ) {
                    return {
                        success: false,
                        message: '邮箱或密码错误',
                    }
                }

                const session: StoredSession = { email: user.email }
                await AsyncStorage.setItem(
                    AUTH_SESSION_KEY,
                    JSON.stringify(session)
                )
                setUserEmail(user.email)

                return { success: true }
            } catch {
                return {
                    success: false,
                    message: '登录失败，请稍后重试',
                }
            }
        },
        []
    )

    const register = useCallback(
        async (email: string, password: string): Promise<AuthActionResult> => {
            const normalizedEmail = email.trim().toLowerCase()
            if (!normalizedEmail || !password) {
                return {
                    success: false,
                    message: '请输入邮箱和密码',
                }
            }

            if (password.length < 6) {
                return {
                    success: false,
                    message: '密码至少 6 位',
                }
            }

            try {
                const user: StoredUser = {
                    email: normalizedEmail,
                    password,
                }
                const session: StoredSession = {
                    email: normalizedEmail,
                }

                await Promise.all([
                    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
                    AsyncStorage.setItem(
                        AUTH_SESSION_KEY,
                        JSON.stringify(session)
                    ),
                ])
                setUserEmail(normalizedEmail)

                return { success: true }
            } catch {
                return {
                    success: false,
                    message: '注册失败，请稍后重试',
                }
            }
        },
        []
    )

    const logout = useCallback(async () => {
        await AsyncStorage.removeItem(AUTH_SESSION_KEY)
        setUserEmail(null)
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: !!userEmail,
            isLoading,
            userEmail,
            login,
            register,
            logout,
        }),
        [isLoading, login, logout, register, userEmail]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
