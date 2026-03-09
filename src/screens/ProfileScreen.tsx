import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useTheme } from 'react-native-paper'

import { useAuth } from '../context/AuthContext'
import {
    achievements,
    getDisplayName,
    getGoals,
    getSettingsEntries,
    weekData,
} from './profile/data'
import { ProfileModals } from './profile/ProfileModals'
import { ProfileOverview } from './profile/ProfileOverview'
import { getProfilePalette, styles } from './profile/styles'
import type {
    NotificationPreferences,
    PrivacyPreferences,
    SettingsTitle,
    WeeklyEntry,
} from './profile/types'

export function ProfileScreen() {
    const theme = useTheme()
    const { logout, userEmail, userProfile } = useAuth()
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

    const palette = useMemo(() => getProfilePalette(theme), [theme])
    const displayName = getDisplayName(userEmail)
    const goals = getGoals(userProfile)
    const settingsEntries = getSettingsEntries(userProfile)
    const averageCalories = Math.round(
        weekData.reduce((sum, item) => sum + item.calories, 0) / weekData.length
    )
    const bodyMassIndex =
        userProfile?.height && userProfile?.weight
            ? userProfile.weight / (userProfile.height / 100) ** 2
            : null
    const selectedSettingEntry = selectedSetting
        ? settingsEntries.find((item) => item.title === selectedSetting) ?? null
        : null

    return (
        <View style={[styles.page, { backgroundColor: palette.page }]}>
            <ProfileOverview
                achievements={achievements}
                averageCalories={averageCalories}
                displayName={displayName}
                goals={goals}
                onOpenSettings={() => setShowSettings(true)}
                palette={palette}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                themeColors={{
                    onSurfaceVariant: theme.colors.onSurfaceVariant,
                    primary: theme.colors.primary,
                }}
                userEmail={userEmail}
                weekData={weekData}
            />

            <ProfileModals
                bodyMassIndex={bodyMassIndex}
                displayName={displayName}
                goals={goals}
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
        </View>
    )
}
