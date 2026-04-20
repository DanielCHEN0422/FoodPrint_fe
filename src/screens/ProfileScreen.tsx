import { StatusBar } from 'expo-status-bar'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from 'react-native-paper'

import { getMyActiveChallenges, getMyChallenges } from '../api/challenge'
import { getImpactMetrics, getMyTopics } from '../api/community'
import {
    buildLast7DaySlots,
    getWeeklyOverview,
    mergeWeeklyIntoSlots,
    parseWeeklyOverviewPayload,
} from '../api/food'
import type {
    BodyDataRequest,
    DailyCalorieBarDto,
    ImpactMetricsResponse,
    UserProfileDto,
    UserChallengeDto,
    UserStatsDto,
} from '../api/types'
import {
    getMyStats,
    updateBodyData as updateUserBodyData,
    updateProfile as updateUserProfile,
} from '../api/user'
import { mergeUserProfileDto, useAuth, type UserProfile } from '../context/AuthContext'
import {
    buildAchievementHighlights,
    DEFAULT_PROFILE_AVATAR_URL,
    formatMemberSince,
    getDisplayName,
    getGoals,
    getSettingsEntries,
    weekData,
} from './profile/data'
import { ProfileModals } from './profile/ProfileModals'
import { ProfileOverview } from './profile/ProfileOverview'
import { getProfilePalette, styles } from './profile/styles'
import type {
    ChallengeSummary,
    NotificationPreferences,
    PrivacyPreferences,
    SettingsTitle,
    WeeklyEntry,
} from './profile/types'

type SaveActionResult = {
    message?: string
    success: boolean
}

const WEEKDAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function toWeeklyEntries(bars: DailyCalorieBarDto[]): WeeklyEntry[] {
    return bars.map((bar) => {
        const [y, m, d] = bar.date.split('-').map(Number)
        const dt = new Date(y, (m || 1) - 1, d || 1)
        return {
            calories: Math.round(Number(bar.totalCalories) || 0),
            day: WEEKDAY_SHORT_EN[dt.getDay()] ?? bar.date.slice(5),
        }
    })
}

export function ProfileScreen() {
    const theme = useTheme()
    const { authUserId, logout, updateProfile, userEmail, userProfile } = useAuth()
    const [notificationPreferences, setNotificationPreferences] =
        useState<NotificationPreferences>({
            mealReminders: true,
            streakAlerts: true,
            weeklySummary: false,
        })
    const [privacyPreferences, setPrivacyPreferences] =
        useState<PrivacyPreferences>({
            analyticsSharing: true,
            profileVisibility: false,
        })
    const [selectedDay, setSelectedDay] = useState<WeeklyEntry>(weekData[5])
    const [selectedSetting, setSelectedSetting] = useState<SettingsTitle | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [showSubscription, setShowSubscription] = useState(false)
    const [dashboardLoading, setDashboardLoading] = useState(true)
    const [dashboardNotice, setDashboardNotice] = useState<string | null>(null)
    const [impactMetrics, setImpactMetrics] = useState<ImpactMetricsResponse | null>(
        null
    )
    const [profileStats, setProfileStats] = useState<UserStatsDto | null>(null)
    const [weeklyBars, setWeeklyBars] = useState<DailyCalorieBarDto[]>(
        buildLast7DaySlots(new Date())
    )
    const [allChallenges, setAllChallenges] = useState<UserChallengeDto[]>([])
    const [activeChallenges, setActiveChallenges] = useState<UserChallengeDto[]>([])
    const [myTopics, setMyTopics] = useState<string[]>([])

    const palette = useMemo(() => getProfilePalette(theme), [theme])
    const weeklyEntries = useMemo(() => toWeeklyEntries(weeklyBars), [weeklyBars])
    const displayName = getDisplayName(userProfile?.nickname, userEmail)
    const goals = getGoals(userProfile)
    const settingsEntries = getSettingsEntries(userProfile)
    const achievementHighlights = buildAchievementHighlights(profileStats)
    const avatarUrl = userProfile?.avatarUrl ?? DEFAULT_PROFILE_AVATAR_URL
    const averageCalories =
        weeklyEntries.length > 0
            ? Math.round(
                  weeklyEntries.reduce((sum, item) => sum + item.calories, 0) /
                      weeklyEntries.length
              )
            : 0
    const bodyMassIndex =
        userProfile?.height && userProfile?.weight
            ? userProfile.weight / (userProfile.height / 100) ** 2
            : null
    const memberSinceLabel = formatMemberSince(userProfile?.createdAt)
    const selectedSettingEntry = selectedSetting
        ? settingsEntries.find((item) => item.title === selectedSetting) ?? null
        : null
    const challengeSummary = useMemo<ChallengeSummary>(() => {
        const activeSource =
            activeChallenges.length > 0
                ? activeChallenges
                : allChallenges.filter((item) => item.status === 'IN_PROGRESS')
        const completedCount = allChallenges.filter(
            (item) => item.status === 'COMPLETED'
        ).length
        const longestStreak = allChallenges.reduce(
            (max, item) => Math.max(max, item.currentStreak ?? 0),
            0
        )
        const highlights = [...activeSource]
            .sort((a, b) => {
                const streakDiff = (b.currentStreak ?? 0) - (a.currentStreak ?? 0)
                if (streakDiff !== 0) {
                    return streakDiff
                }
                return (b.progressPercent ?? 0) - (a.progressPercent ?? 0)
            })
            .slice(0, 3)
            .map((item) => ({
                badgeIcon: item.challenge?.badgeIcon?.trim() || '🏆',
                daysRemaining: item.daysRemaining ?? 0,
                id: item.id,
                progressPercent: Math.max(
                    0,
                    Math.min(100, Math.round(item.progressPercent ?? 0))
                ),
                statusLabel: `${item.completedDays ?? 0}/${item.challenge?.durationDays ?? 0} days completed`,
                streakLabel: `${item.currentStreak ?? 0} day streak`,
                title: item.challenge?.title?.trim() || 'Challenge',
                todayCheckedIn: !!item.todayCheckedIn,
            }))

        return {
            activeCount: activeSource.length,
            completedCount,
            highlights,
            longestStreak,
        }
    }, [activeChallenges, allChallenges])

    useEffect(() => {
        if (weeklyEntries.length === 0) {
            return
        }

        setSelectedDay((current) => {
            const existing = weeklyEntries.find((item) => item.day === current.day)
            return existing ?? weeklyEntries[weeklyEntries.length - 1]
        })
    }, [weeklyEntries])

    const loadProfileData = useCallback(async () => {
        setDashboardLoading(true)
        setDashboardNotice(null)

        const [
            impactMetricsRes,
            statsRes,
            weeklyRes,
            myChallengesRes,
            activeChallengesRes,
            myTopicsRes,
        ] = await Promise.allSettled([
            getImpactMetrics(),
            getMyStats(),
            getWeeklyOverview(authUserId ?? ''),
            getMyChallenges(),
            getMyActiveChallenges(),
            getMyTopics(),
        ])

        let failedRequests = 0
        let succeededRequests = 0

        if (impactMetricsRes.status === 'fulfilled') {
            succeededRequests += 1
            if (impactMetricsRes.value?.data) {
                setImpactMetrics(impactMetricsRes.value.data)
            }
        } else {
            failedRequests += 1
        }

        if (statsRes.status === 'fulfilled') {
            succeededRequests += 1
            if (statsRes.value?.data) {
                setProfileStats(statsRes.value.data)
            }
        } else {
            failedRequests += 1
        }

        if (weeklyRes.status === 'fulfilled') {
            succeededRequests += 1
            const parsed = parseWeeklyOverviewPayload(weeklyRes.value.data)
            const merged = mergeWeeklyIntoSlots(buildLast7DaySlots(new Date()), parsed)
            if (merged.length > 0) {
                setWeeklyBars(merged)
            }
        } else {
            failedRequests += 1
        }

        if (myChallengesRes.status === 'fulfilled') {
            succeededRequests += 1
            if (Array.isArray(myChallengesRes.value?.data)) {
                setAllChallenges(myChallengesRes.value.data)
            }
        } else {
            failedRequests += 1
        }

        if (activeChallengesRes.status === 'fulfilled') {
            succeededRequests += 1
            if (Array.isArray(activeChallengesRes.value?.data)) {
                setActiveChallenges(activeChallengesRes.value.data)
            }
        } else {
            failedRequests += 1
        }

        if (myTopicsRes.status === 'fulfilled') {
            succeededRequests += 1
            if (Array.isArray(myTopicsRes.value?.data)) {
                setMyTopics(myTopicsRes.value.data)
            }
        } else {
            failedRequests += 1
        }

        if (succeededRequests === 0) {
            setDashboardNotice(
                'Profile data is temporarily unavailable. Check the backend and try again.'
            )
        } else if (failedRequests > 0) {
            setDashboardNotice(
                'Some profile sections could not be loaded. Showing the data that is available.'
            )
        }

        setDashboardLoading(false)
    }, [authUserId])

    useFocusEffect(
        useCallback(() => {
            void loadProfileData()
        }, [loadProfileData])
    )

    const getFallbackProfile = useCallback(
        (overrides: Partial<UserProfile> = {}): UserProfile => ({
            activityLevel: userProfile?.activityLevel ?? 'medium',
            age: userProfile?.age ?? 0,
            avatarUrl: userProfile?.avatarUrl ?? null,
            createdAt: userProfile?.createdAt,
            dailyCalories: userProfile?.dailyCalories ?? 2000,
            dietPreference: userProfile?.dietPreference ?? 'none',
            email: userProfile?.email ?? userEmail ?? '',
            gender: userProfile?.gender ?? 'other',
            goal: userProfile?.goal ?? 'maintain',
            height: userProfile?.height ?? 0,
            nickname: userProfile?.nickname ?? '',
            weight: userProfile?.weight ?? 0,
            ...overrides,
        }),
        [userEmail, userProfile]
    )

    const syncLocalProfile = useCallback(
        async (dto: UserProfileDto | null, fallback: UserProfile) => {
            const nextProfile =
                dto && userEmail
                    ? mergeUserProfileDto(dto, userEmail, fallback)
                    : fallback
            await updateProfile(nextProfile)
        },
        [updateProfile, userEmail]
    )

    const savePersonalInfo = useCallback(
        async (values: { avatarUrl: string; nickname: string }): Promise<SaveActionResult> => {
            try {
                const res = await updateUserProfile({
                    avatarUrl: values.avatarUrl || undefined,
                    nickname: values.nickname || undefined,
                })
                const fallbackProfile = getFallbackProfile({
                    avatarUrl: values.avatarUrl || null,
                    nickname: values.nickname,
                })
                await syncLocalProfile(res.data, fallbackProfile)
                return { message: 'Personal information updated.', success: true }
            } catch (error) {
                return {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to update personal information.',
                    success: false,
                }
            }
        },
        [getFallbackProfile, syncLocalProfile]
    )

    const saveBodyData = useCallback(
        async (values: BodyDataRequest): Promise<SaveActionResult> => {
            try {
                const res = await updateUserBodyData(values)
                const fallbackProfile = getFallbackProfile({
                    age:
                        typeof values.age === 'number'
                            ? values.age
                            : userProfile?.age ?? 0,
                    dailyCalories:
                        typeof values.dailyCalorieTarget === 'number'
                            ? values.dailyCalorieTarget
                            : userProfile?.dailyCalories ?? 2000,
                    dietPreference:
                        values.dietaryPreference ?? userProfile?.dietPreference ?? 'none',
                    gender:
                        values.gender === 'male' ||
                        values.gender === 'female' ||
                        values.gender === 'other'
                            ? values.gender
                            : userProfile?.gender ?? 'other',
                    goal:
                        values.goal === 'lose' ||
                        values.goal === 'maintain' ||
                        values.goal === 'gain'
                            ? values.goal
                            : userProfile?.goal ?? 'maintain',
                    height:
                        typeof values.heightCm === 'number'
                            ? values.heightCm
                            : userProfile?.height ?? 0,
                    weight:
                        typeof values.weightKg === 'number'
                            ? values.weightKg
                            : userProfile?.weight ?? 0,
                })
                await syncLocalProfile(res.data, fallbackProfile)
                return { message: 'Body data updated.', success: true }
            } catch (error) {
                return {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to update body data.',
                    success: false,
                }
            }
        },
        [getFallbackProfile, syncLocalProfile, userProfile]
    )

    return (
        <SafeAreaView
            style={[styles.page, { backgroundColor: palette.page }]}
            edges={['left', 'right']}
        >
            <ProfileOverview
                achievements={achievementHighlights}
                avatarUrl={avatarUrl}
                averageCalories={averageCalories}
                dashboardLoading={dashboardLoading}
                dashboardNotice={dashboardNotice}
                displayName={displayName}
                goals={goals}
                impactMetrics={impactMetrics}
                memberSinceLabel={memberSinceLabel}
                onOpenSettings={() => setShowSettings(true)}
                palette={palette}
                challengeSummary={challengeSummary}
                myTopics={myTopics}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                stats={profileStats}
                themeColors={{
                    onSurfaceVariant: theme.colors.onSurfaceVariant,
                    primary: theme.colors.primary,
                }}
                userEmail={userEmail}
                weekData={weeklyEntries}
            />

            <ProfileModals
                authUserId={authUserId}
                bodyMassIndex={bodyMassIndex}
                displayName={displayName}
                goals={goals}
                memberSinceLabel={memberSinceLabel}
                notificationPreferences={notificationPreferences}
                onBackToSettings={() => {
                    setSelectedSetting(null)
                    setShowSettings(true)
                }}
                onCloseDetail={() => setSelectedSetting(null)}
                onCloseSettings={() => setShowSettings(false)}
                onCloseSubscription={() => setShowSubscription(false)}
                onOpenSetting={(title) => {
                    setShowSettings(false)
                    setSelectedSetting(title)
                }}
                onOpenSubscription={() => setShowSubscription(true)}
                onSaveBodyData={saveBodyData}
                onSavePersonalInfo={savePersonalInfo}
                onToggleNotification={(key, value) =>
                    setNotificationPreferences((current) => ({
                        ...current,
                        [key]: value,
                    }))
                }
                onTogglePrivacy={(key, value) =>
                    setPrivacyPreferences((current) => ({
                        ...current,
                        [key]: value,
                    }))
                }
                palette={palette}
                privacyPreferences={privacyPreferences}
                selectedSetting={selectedSetting}
                selectedSettingEntry={selectedSettingEntry}
                settingsEntries={settingsEntries}
                showSettings={showSettings}
                showSubscription={showSubscription}
                signOut={() => {
                    setShowSettings(false)
                    void logout()
                }}
                themeColors={{
                    onSurfaceVariant: theme.colors.onSurfaceVariant,
                    primary: theme.colors.primary,
                }}
                userEmail={userEmail}
                userProfile={userProfile}
            />

            <StatusBar style="auto" />
        </SafeAreaView>
    )
}
