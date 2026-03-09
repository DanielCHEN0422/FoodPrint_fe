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
    hasCompletedOnboarding: boolean
    isLoading: boolean
    userProfile: UserProfile | null
    userEmail: string | null
    completeOnboarding: () => Promise<void>
    login: (email: string, password: string) => Promise<AuthActionResult>
    register: (email: string, password: string) => Promise<AuthActionResult>
    logout: () => Promise<void>
    updateProfile: (profile: UserProfile) => Promise<void>
}

type StoredUser = {
    email: string
    password: string
}

type StoredSession = {
    email: string
}

export type UserProfile = {
    email: string
    goal: 'lose' | 'maintain' | 'gain'
    gender: 'male' | 'female' | 'other'
    height: number
    weight: number
    age: number
    activityLevel: 'low' | 'medium' | 'high'
    dietPreference: string
    dailyCalories: number
}

const AUTH_USER_KEY = '@foodprint/auth_user'
const AUTH_SESSION_KEY = '@foodprint/auth_session'
const AUTH_PROFILE_KEY = '@foodprint/auth_profile'
const AUTH_ONBOARDING_KEY = '@foodprint/auth_onboarding_completed'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PasswordStrength = {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
    score: number
    isStrong: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function isValidEmail(email: string) {
    return EMAIL_REGEX.test(email.trim().toLowerCase())
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
    const result: PasswordStrength = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password),
        score: 0,
        isStrong: false,
    }

    result.score = [
        result.minLength,
        result.hasUppercase,
        result.hasLowercase,
        result.hasNumber,
        result.hasSpecial,
    ].filter(Boolean).length
    result.isStrong = result.score === 5

    return result
}

export function AuthProvider({ children }: PropsWithChildren) {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        async function restoreSession() {
            try {
                const [sessionRaw, onboardingRaw, profileRaw] =
                    await Promise.all([
                        AsyncStorage.getItem(AUTH_SESSION_KEY),
                        AsyncStorage.getItem(AUTH_ONBOARDING_KEY),
                        AsyncStorage.getItem(AUTH_PROFILE_KEY),
                    ])
                if (!sessionRaw) {
                    return
                }

                const session = JSON.parse(sessionRaw) as StoredSession
                if (session.email) {
                    setUserEmail(session.email)
                }

                if (profileRaw) {
                    const profile = JSON.parse(profileRaw) as UserProfile
                    setUserProfile(profile)
                }

                if (onboardingRaw === 'false') {
                    setHasCompletedOnboarding(false)
                } else {
                    setHasCompletedOnboarding(true)
                }
            } catch {
                await AsyncStorage.removeItem(AUTH_SESSION_KEY)
                await AsyncStorage.removeItem(AUTH_ONBOARDING_KEY)
                setUserEmail(null)
                setHasCompletedOnboarding(true)
            } finally {
                setIsLoading(false)
            }
        }

        void restoreSession()
    }, [])

    const login = useCallback(
        async (email: string, password: string): Promise<AuthActionResult> => {
            void password
            const normalizedEmail = email.trim().toLowerCase()
            try {
                const sessionEmail =
                    normalizedEmail || `mock-user-${Date.now()}@foodprint.local`
                const session: StoredSession = { email: sessionEmail }
                await AsyncStorage.setItem(
                    AUTH_SESSION_KEY,
                    JSON.stringify(session)
                )
                setUserEmail(sessionEmail)
                setHasCompletedOnboarding(true)
                await AsyncStorage.setItem(AUTH_ONBOARDING_KEY, 'true')

                return { success: true }
            } catch {
                const fallbackEmail =
                    normalizedEmail || `mock-user-${Date.now()}@foodprint.local`
                setUserEmail(fallbackEmail)
                setHasCompletedOnboarding(true)
                return { success: true }
            }
        },
        []
    )

    const register = useCallback(
        async (email: string, password: string): Promise<AuthActionResult> => {
            const normalizedEmail =
                email.trim().toLowerCase() || `mock-user-${Date.now()}@foodprint.local`
            const normalizedPassword = password || 'mock-password'

            try {
                const user: StoredUser = {
                    email: normalizedEmail,
                    password: normalizedPassword,
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
                    AsyncStorage.setItem(AUTH_ONBOARDING_KEY, 'false'),
                ])
                setUserEmail(normalizedEmail)
                setHasCompletedOnboarding(false)
                setUserProfile(null)

                return { success: true }
            } catch {
                setUserEmail(normalizedEmail)
                setHasCompletedOnboarding(false)
                setUserProfile(null)
                return { success: true }
            }
        },
        []
    )

    const logout = useCallback(async () => {
        // 先更新内存态，确保 UI 立即回到未登录导航
        setHasCompletedOnboarding(true)
        setUserEmail(null)
        try {
            await AsyncStorage.removeItem(AUTH_SESSION_KEY)
        } catch {
            // mock 场景下不阻塞退出流程
        }
    }, [])

    const updateProfile = useCallback(async (profile: UserProfile) => {
        setUserProfile(profile)
        try {
            await AsyncStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile))
        } catch {
            // profile 持久化失败不阻断 onboarding 流程
        }
    }, [])

    const completeOnboarding = useCallback(async () => {
        setHasCompletedOnboarding(true)
        try {
            await AsyncStorage.setItem(AUTH_ONBOARDING_KEY, 'true')
        } catch {
            // 持久化失败不阻断页面流转
        }
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: !!userEmail,
            hasCompletedOnboarding,
            isLoading,
            userProfile,
            userEmail,
            completeOnboarding,
            login,
            register,
            logout,
            updateProfile,
        }),
        [
            completeOnboarding,
            hasCompletedOnboarding,
            isLoading,
            login,
            logout,
            register,
            updateProfile,
            userEmail,
            userProfile,
        ]
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
