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

import type { UserProfileDto } from '../api/types'
import { getMe } from '../api/user'
import { supabase } from '../lib/supabase'

type AuthActionResult = {
    success: boolean
    message?: string
}

type AuthContextValue = {
    isAuthenticated: boolean
    /** 为 true 时 Supabase 处于 recovery 会话：须完成改密，不应进入主应用 Tab */
    isPasswordRecovery: boolean
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
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

    useEffect(() => {
        async function restoreSession() {
            try {
                await supabase.auth.refreshSession()
                const {
                    data: { session },
                } = await supabase.auth.getSession()
                if (session?.user?.email) {
                    setUserEmail(session.user.email)
                }

                const [onboardingRaw, profileRaw] = await Promise.all([
                    AsyncStorage.getItem(AUTH_ONBOARDING_KEY),
                    AsyncStorage.getItem(AUTH_PROFILE_KEY),
                ])

                if (session?.user?.email) {
                    try {
                        const res = await getMe()
                        const d = res?.data ?? (res as unknown as UserProfileDto)
                        if (d && typeof d === 'object' && ('id' in d || 'email' in d)) {
                            const u = d as UserProfileDto
                            setUserProfile({
                                activityLevel: 'medium',
                                age: u.age ?? 0,
                                dailyCalories: u.dailyCalorieTarget ?? 2000,
                                dietPreference: 'none',
                                email: u.email ?? session.user.email ?? '',
                                gender:
                                    (u.gender as UserProfile['gender']) ?? 'other',
                                goal:
                                    (u.goal as UserProfile['goal']) ?? 'maintain',
                                height: u.heightCm ?? 0,
                                weight: u.weightKg ?? 0,
                            })
                        } else if (profileRaw) {
                            setUserProfile(JSON.parse(profileRaw) as UserProfile)
                        }
                    } catch {
                        if (profileRaw) {
                            setUserProfile(JSON.parse(profileRaw) as UserProfile)
                        }
                    }
                } else if (profileRaw) {
                    setUserProfile(JSON.parse(profileRaw) as UserProfile)
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
                setIsPasswordRecovery(false)
                setHasCompletedOnboarding(true)
            } finally {
                setIsLoading(false)
            }
        }

        void restoreSession()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUserEmail(session?.user?.email ?? null)
            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true)
            } else if (event === 'SIGNED_OUT') {
                setIsPasswordRecovery(false)
            } else if (event === 'SIGNED_IN') {
                setIsPasswordRecovery(false)
            }
        })
        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const login = useCallback(
        async (email: string, password: string): Promise<AuthActionResult> => {
            const normalizedEmail = email.trim().toLowerCase()
            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            })
            if (error) {
                const msg =
                    /network|fetch|failed|connection/i.test(error.message)
                        ? 'Network error. Check your connection and try again.'
                        : error.message || 'Login failed'
                return { success: false, message: msg }
            }
            setUserEmail(data.user?.email ?? normalizedEmail)
            setIsPasswordRecovery(false)
            setHasCompletedOnboarding(true)
            await AsyncStorage.setItem(AUTH_ONBOARDING_KEY, 'true')
            return { success: true }
        },
        []
    )

    const register = useCallback(
        async (email: string, password: string): Promise<AuthActionResult> => {
            const normalizedEmail = email.trim().toLowerCase()
            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
            })
            if (error) {
                const msg =
                    /network|fetch|failed|connection/i.test(error.message)
                        ? 'Network error. Check your connection and try again.'
                        : error.message || 'Registration failed'
                return { success: false, message: msg }
            }
            if (!data.session) {
                return {
                    success: true,
                    message: 'Please check your email and click the link to verify your account',
                }
            }
            const sessionEmail = data.user?.email ?? normalizedEmail
            setUserEmail(sessionEmail)
            setIsPasswordRecovery(false)
            setHasCompletedOnboarding(false)
            setUserProfile(null)
            await AsyncStorage.setItem(AUTH_ONBOARDING_KEY, 'false')
            return { success: true }
        },
        []
    )

    const logout = useCallback(async () => {
        setHasCompletedOnboarding(true)
        setIsPasswordRecovery(false)
        setUserEmail(null)
        try {
            await supabase.auth.signOut()
            await AsyncStorage.removeItem(AUTH_SESSION_KEY)
        } catch {
            // 不阻塞退出流程
        }
    }, [])

    const updateProfile = useCallback(async (profile: UserProfile) => {
        setUserProfile(profile)
        try {
            await AsyncStorage.setItem(
                AUTH_PROFILE_KEY,
                JSON.stringify(profile)
            )
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
            isPasswordRecovery,
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
            isPasswordRecovery,
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
