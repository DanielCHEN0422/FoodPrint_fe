import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Alert, ScrollView, View } from 'react-native'
import {
    Button,
    Card,
    Divider,
    IconButton,
    Modal,
    Portal,
    ProgressBar,
    Switch,
    Text,
} from 'react-native-paper'

import type { UserProfile } from '../../context/AuthContext'
import { formatActivityLevel, formatGoal } from './data'
import { styles } from './styles'
import type {
    GoalEntry,
    NotificationPreferences,
    PrivacyPreferences,
    SettingsEntry,
    SettingsTitle,
} from './types'

type ThemeColors = {
    onSurfaceVariant: string
    primary: string
}

type DetailContentProps = {
    bodyMassIndex: number | null
    displayName: string
    goals: GoalEntry[]
    notificationPreferences: NotificationPreferences
    onToggleNotification: (
        key: keyof NotificationPreferences,
        value: boolean
    ) => void
    onTogglePrivacy: (key: keyof PrivacyPreferences, value: boolean) => void
    palette: ReturnType<typeof import('./styles').getProfilePalette>
    privacyPreferences: PrivacyPreferences
    selectedSetting: SettingsTitle | null
    userEmail: string | null
    userProfile: UserProfile | null
}

type ProfileModalsProps = DetailContentProps & {
    onBackToSettings: () => void
    onCloseDetail: () => void
    onCloseSettings: () => void
    onCloseSubscription: () => void
    onOpenSetting: (title: SettingsTitle) => void
    onOpenSubscription: () => void
    selectedSettingEntry: SettingsEntry | null
    settingsEntries: SettingsEntry[]
    showSettings: boolean
    showSubscription: boolean
    signOut: () => void
    themeColors: ThemeColors
}

function DetailContent({
    bodyMassIndex,
    displayName,
    goals,
    notificationPreferences,
    onToggleNotification,
    onTogglePrivacy,
    palette,
    privacyPreferences,
    selectedSetting,
    userEmail,
    userProfile,
}: DetailContentProps) {
    if (!selectedSetting) {
        return null
    }

    if (selectedSetting === 'Personal Information') {
        return (
            <View style={styles.detailBody}>
                <Card
                    style={[
                        styles.detailInfoCard,
                        styles.detailCardFrame,
                        {
                            backgroundColor: palette.detailAccent,
                            borderColor: palette.detailBorder,
                        },
                    ]}
                >
                    <Card.Content style={styles.sectionContent}>
                        <Text style={styles.sectionTitle}>Profile Identity</Text>
                        {[
                            { label: 'Full name', value: displayName },
                            { label: 'Email', value: userEmail ?? 'Not added yet' },
                            { label: 'Contact', value: 'Add a phone number' },
                            {
                                label: 'Diet preference',
                                value: userProfile?.dietPreference ?? 'Balanced plan',
                            },
                        ].map((item) => (
                            <View key={item.label} style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                                    {item.label}
                                </Text>
                                <Text style={styles.detailValue}>{item.value}</Text>
                            </View>
                        ))}
                    </Card.Content>
                </Card>

                <Button
                    mode="contained"
                    onPress={() =>
                        Alert.alert(
                            'Profile',
                            'Profile editing can be connected here next.'
                        )
                    }
                >
                    <Text>Edit personal information</Text>
                </Button>
            </View>
        )
    }

    if (selectedSetting === 'Body Metrics') {
        return (
            <View style={styles.detailBody}>
                <View style={styles.metricGrid}>
                    {[
                        { label: 'Weight', value: `${userProfile?.weight ?? 75} kg` },
                        { label: 'Height', value: `${userProfile?.height ?? 175} cm` },
                        { label: 'Age', value: `${userProfile?.age ?? 27}` },
                        {
                            label: 'BMI',
                            value: bodyMassIndex ? bodyMassIndex.toFixed(1) : '24.5',
                        },
                    ].map((item) => (
                        <Card
                            key={item.label}
                            style={[
                                styles.metricCard,
                                styles.metricCardFrame,
                                {
                                    backgroundColor: palette.detailStrongSurface,
                                    borderColor: palette.detailBorder,
                                },
                            ]}
                        >
                            <Card.Content>
                                <Text style={[styles.metricLabel, { color: palette.mutedText }]}>
                                    {item.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.metricValue,
                                        { color: palette.detailHighlight },
                                    ]}
                                >
                                    {item.value}
                                </Text>
                            </Card.Content>
                        </Card>
                    ))}
                </View>

                <Card
                    style={[
                        styles.detailInfoCard,
                        styles.detailCardFrame,
                        {
                            backgroundColor: palette.detailAccent,
                            borderColor: palette.detailBorder,
                        },
                    ]}
                >
                    <Card.Content style={styles.sectionContent}>
                        <Text style={styles.sectionTitle}>Daily Snapshot</Text>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                                Activity level
                            </Text>
                            <Text style={styles.detailValue}>
                                {formatActivityLevel(userProfile?.activityLevel)}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                                Body focus
                            </Text>
                            <Text style={styles.detailValue}>
                                Lean and sustainable progress
                            </Text>
                        </View>
                    </Card.Content>
                </Card>
            </View>
        )
    }

    if (selectedSetting === 'Health Goals') {
        return (
            <View style={styles.detailBody}>
                <Card
                    style={[
                        styles.detailInfoCard,
                        styles.detailCardFrame,
                        {
                            backgroundColor: palette.detailAccent,
                            borderColor: palette.detailBorder,
                        },
                    ]}
                >
                    <Card.Content style={styles.sectionContent}>
                        <Text style={styles.sectionTitle}>Goal Summary</Text>
                        {[
                            { label: 'Primary goal', value: formatGoal(userProfile?.goal) },
                            {
                                label: 'Daily calories',
                                value: `${userProfile?.dailyCalories ?? 2000} kcal`,
                            },
                            {
                                label: 'Protein target',
                                value: `${Math.max(
                                    90,
                                    Math.round((userProfile?.weight ?? 75) * 2)
                                )} g`,
                            },
                            { label: 'Hydration', value: '8 glasses daily' },
                        ].map((item) => (
                            <View key={item.label} style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                                    {item.label}
                                </Text>
                                <Text style={styles.detailValue}>{item.value}</Text>
                            </View>
                        ))}
                    </Card.Content>
                </Card>

                <Card
                    style={[
                        styles.detailInfoCard,
                        styles.detailCardFrame,
                        {
                            backgroundColor: palette.detailStrongSurface,
                            borderColor: palette.detailBorder,
                        },
                    ]}
                >
                    <Card.Content style={styles.goalList}>
                        {goals.map((goal) => (
                            <View key={goal.label} style={styles.goalBlock}>
                                <View style={styles.goalHeader}>
                                    <Text style={styles.goalLabel}>{goal.label}</Text>
                                    <Text
                                        style={[
                                            styles.goalCurrent,
                                            { color: palette.detailHighlight },
                                        ]}
                                    >
                                        {goal.current}
                                    </Text>
                                </View>
                                <ProgressBar
                                    color={palette.activeBar}
                                    progress={goal.progress}
                                    style={[
                                        styles.progressBar,
                                        { backgroundColor: palette.progressTrack },
                                    ]}
                                />
                            </View>
                        ))}
                    </Card.Content>
                </Card>
            </View>
        )
    }

    if (selectedSetting === 'Notifications') {
        return (
            <View style={styles.detailBody}>
                <Card
                    style={[
                        styles.detailInfoCard,
                        styles.detailCardFrame,
                        {
                            backgroundColor: palette.detailAccent,
                            borderColor: palette.detailBorder,
                        },
                    ]}
                >
                    <Card.Content style={styles.sectionContent}>
                        {[
                            {
                                description:
                                    'Get reminded before your preferred meal logging time.',
                                key: 'mealReminders' as const,
                                title: 'Meal reminders',
                            },
                            {
                                description:
                                    'Receive motivation when you keep your daily streak alive.',
                                key: 'streakAlerts' as const,
                                title: 'Streak alerts',
                            },
                            {
                                description:
                                    'See a recap of calories, activity, and achievements every week.',
                                key: 'weeklySummary' as const,
                                title: 'Weekly summary',
                            },
                        ].map((item) => (
                            <View
                                key={item.key}
                                style={[
                                    styles.preferencePanel,
                                    styles.preferenceRow,
                                    {
                                        backgroundColor: palette.detailStrongSurface,
                                        borderColor: palette.detailBorder,
                                    },
                                ]}
                            >
                                <View style={styles.preferenceText}>
                                    <Text style={styles.settingsTitle}>{item.title}</Text>
                                    <Text
                                        style={[
                                            styles.preferenceDescription,
                                            { color: palette.mutedText },
                                        ]}
                                    >
                                        {item.description}
                                    </Text>
                                </View>
                                <Switch
                                    onValueChange={(value) =>
                                        onToggleNotification(item.key, value)
                                    }
                                    value={notificationPreferences[item.key]}
                                />
                            </View>
                        ))}
                    </Card.Content>
                </Card>
            </View>
        )
    }

    if (selectedSetting === 'Privacy & Security') {
        return (
            <View style={styles.detailBody}>
                <Card
                    style={[
                        styles.detailInfoCard,
                        styles.detailCardFrame,
                        {
                            backgroundColor: palette.detailAccent,
                            borderColor: palette.detailBorder,
                        },
                    ]}
                >
                    <Card.Content style={styles.sectionContent}>
                        {[
                            {
                                description:
                                    'Allow other community members to see your public progress.',
                                key: 'profileVisibility' as const,
                                title: 'Profile visibility',
                            },
                            {
                                description:
                                    'Share anonymous usage signals to improve recommendations.',
                                key: 'analyticsSharing' as const,
                                title: 'Analytics sharing',
                            },
                        ].map((item) => (
                            <View
                                key={item.key}
                                style={[
                                    styles.preferencePanel,
                                    styles.preferenceRow,
                                    {
                                        backgroundColor: palette.detailStrongSurface,
                                        borderColor: palette.detailBorder,
                                    },
                                ]}
                            >
                                <View style={styles.preferenceText}>
                                    <Text style={styles.settingsTitle}>{item.title}</Text>
                                    <Text
                                        style={[
                                            styles.preferenceDescription,
                                            { color: palette.mutedText },
                                        ]}
                                    >
                                        {item.description}
                                    </Text>
                                </View>
                                <Switch
                                    onValueChange={(value) =>
                                        onTogglePrivacy(item.key, value)
                                    }
                                    value={privacyPreferences[item.key]}
                                />
                            </View>
                        ))}
                    </Card.Content>
                </Card>

                <View style={styles.securityActions}>
                    <Button
                        mode="outlined"
                        onPress={() =>
                            Alert.alert(
                                'Privacy',
                                'Export request can be connected here next.'
                            )
                        }
                    >
                        <Text>Export my data</Text>
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={() =>
                            Alert.alert(
                                'Security',
                                'Permission review can be connected here next.'
                            )
                        }
                    >
                        <Text>Review permissions</Text>
                    </Button>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.detailBody}>
            <Card
                style={[
                    styles.detailInfoCard,
                    styles.detailCardFrame,
                    {
                        backgroundColor: palette.detailAccent,
                        borderColor: palette.detailBorder,
                    },
                ]}
            >
                <Card.Content style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Password Protection</Text>
                    {[
                        { label: 'Current status', value: 'Strong password enabled' },
                        { label: 'Last updated', value: '14 days ago' },
                        { label: 'Recommended action', value: 'Rotate every 90 days' },
                    ].map((item) => (
                        <View key={item.label} style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                                {item.label}
                            </Text>
                            <Text style={styles.detailValue}>{item.value}</Text>
                        </View>
                    ))}
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={() =>
                    Alert.alert(
                        'Password',
                        'Password change flow can be connected here next.'
                    )
                }
            >
                <Text>Change password</Text>
            </Button>
        </View>
    )
}

export function ProfileModals({
    bodyMassIndex,
    displayName,
    goals,
    notificationPreferences,
    onBackToSettings,
    onCloseDetail,
    onCloseSettings,
    onCloseSubscription,
    onOpenSetting,
    onOpenSubscription,
    onToggleNotification,
    onTogglePrivacy,
    palette,
    privacyPreferences,
    selectedSetting,
    selectedSettingEntry,
    settingsEntries,
    showSettings,
    showSubscription,
    signOut,
    themeColors,
    userEmail,
    userProfile,
}: ProfileModalsProps) {
    return (
        <Portal>
            <Modal
                contentContainerStyle={[
                    styles.modalCard,
                    { backgroundColor: palette.surface },
                ]}
                dismissable
                onDismiss={onCloseSettings}
                visible={showSettings}
            >
                <View style={styles.modalInner}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Account & Settings</Text>
                        <IconButton
                            icon={() => (
                                <MaterialCommunityIcons
                                    color={themeColors.onSurfaceVariant}
                                    name="close"
                                    size={22}
                                />
                            )}
                            onPress={onCloseSettings}
                            style={styles.modalCloseButton}
                        />
                    </View>

                    <View style={styles.settingsList}>
                        <View
                            style={[
                                styles.premiumRow,
                                styles.settingsRow,
                                {
                                    backgroundColor: palette.premiumSurface,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.settingsIcon,
                                    { backgroundColor: palette.premiumBadge },
                                ]}
                            >
                                <MaterialCommunityIcons color="#FFFFFF" name="crown-outline" size={20} />
                            </View>
                            <View style={styles.settingsCopy}>
                                <Text style={styles.settingsTitle}>Premium Subscription</Text>
                                <Text
                                    style={[
                                        styles.settingsSubtitle,
                                        { color: palette.mutedText },
                                    ]}
                                >
                                    Unlock advanced features
                                </Text>
                            </View>
                            <IconButton
                                icon={() => (
                                    <MaterialCommunityIcons
                                        color={themeColors.onSurfaceVariant}
                                        name="chevron-right"
                                        size={20}
                                    />
                                )}
                                onPress={() => {
                                    onCloseSettings()
                                    onOpenSubscription()
                                }}
                                style={styles.modalCloseButton}
                            />
                        </View>

                        {settingsEntries.map((item) => (
                            <View
                                key={item.title}
                                style={[
                                    styles.settingsPanel,
                                    styles.settingsRow,
                                    {
                                        backgroundColor: palette.detailAccent,
                                        borderColor: palette.detailBorder,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.settingsIcon,
                                        { backgroundColor: palette.detailStrongSurface },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        color={themeColors.primary}
                                        name={item.icon}
                                        size={20}
                                    />
                                </View>
                                <View style={styles.settingsCopy}>
                                    <Text style={styles.settingsTitle}>{item.title}</Text>
                                    <Text
                                        style={[
                                            styles.settingsSubtitle,
                                            { color: palette.mutedText },
                                        ]}
                                    >
                                        {item.description}
                                    </Text>
                                </View>
                                <IconButton
                                    icon={() => (
                                        <MaterialCommunityIcons
                                            color={themeColors.onSurfaceVariant}
                                            name="chevron-right"
                                            size={20}
                                        />
                                    )}
                                    onPress={() => onOpenSetting(item.title)}
                                    style={styles.modalCloseButton}
                                />
                            </View>
                        ))}
                    </View>

                    <View style={styles.modalFooter}>
                        <Divider style={styles.divider} />
                        <Button mode="text" onPress={signOut} style={styles.signOutButton}>
                            <Text
                                style={[
                                    styles.signOutText,
                                    { color: palette.dangerText },
                                ]}
                            >
                                Log Out
                            </Text>
                        </Button>
                    </View>
                </View>
            </Modal>

            <Modal
                contentContainerStyle={[
                    styles.modalCard,
                    { backgroundColor: palette.surface },
                ]}
                dismissable
                onDismiss={onCloseSubscription}
                visible={showSubscription}
            >
                <View style={styles.modalInner}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Premium Subscription</Text>
                        <IconButton
                            icon={() => (
                                <MaterialCommunityIcons
                                    color={themeColors.onSurfaceVariant}
                                    name="close"
                                    size={22}
                                />
                            )}
                            onPress={onCloseSubscription}
                            style={styles.modalCloseButton}
                        />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                        style={styles.modalScroll}
                    >
                        <View
                            style={[
                                styles.subscriptionHero,
                                { backgroundColor: palette.premiumSurface },
                            ]}
                        >
                            <View
                                style={[
                                    styles.subscriptionIcon,
                                    { backgroundColor: palette.premiumBadge },
                                ]}
                            >
                                <MaterialCommunityIcons color="#FFFFFF" name="crown-outline" size={24} />
                            </View>
                            <Text style={styles.subscriptionTitle}>Upgrade your FoodPrint plan</Text>
                            <Text
                                style={[
                                    styles.subscriptionBody,
                                    { color: palette.mutedText },
                                ]}
                            >
                                Access smarter nutrition insights, progress summaries, and
                                advanced profile analytics.
                            </Text>
                        </View>

                        <View style={styles.subscriptionList}>
                            {[
                                'Advanced calorie and trend insights',
                                'Personalized weekly progress recaps',
                                'Priority access to new features',
                            ].map((item) => (
                                <View key={item} style={styles.subscriptionRow}>
                                    <MaterialCommunityIcons
                                        color={themeColors.primary}
                                        name="check-circle-outline"
                                        size={20}
                                    />
                                    <Text
                                        style={[
                                            styles.subscriptionItemText,
                                            { color: palette.mutedText },
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <View style={styles.subscriptionActions}>
                            <Button
                                mode="contained"
                                onPress={() => {
                                    onCloseSubscription()
                                    Alert.alert(
                                        'Premium Subscription',
                                        'This action is ready for future payment flow integration.'
                                    )
                                }}
                            >
                                <Text>Start Premium</Text>
                            </Button>
                            <Button mode="text" onPress={onCloseSubscription}>
                                <Text>Maybe later</Text>
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                contentContainerStyle={[
                    styles.modalCard,
                    { backgroundColor: palette.surface },
                ]}
                dismissable
                onDismiss={onCloseDetail}
                visible={!!selectedSetting}
            >
                <View style={styles.modalInner}>
                    <View style={styles.detailHeader}>
                        <IconButton
                            icon={() => (
                                <MaterialCommunityIcons
                                    color={themeColors.onSurfaceVariant}
                                    name="arrow-left"
                                    size={22}
                                />
                            )}
                            onPress={onBackToSettings}
                            style={styles.modalCloseButton}
                        />
                        <View style={styles.detailHeaderCopy}>
                            <Text style={styles.detailHeaderTitle}>{selectedSetting}</Text>
                            <Text
                                style={[
                                    styles.detailHeaderSubtitle,
                                    { color: palette.mutedText },
                                ]}
                            >
                                {selectedSettingEntry?.description ??
                                    'Manage this section of your account.'}
                            </Text>
                        </View>
                        <IconButton
                            icon={() => (
                                <MaterialCommunityIcons
                                    color={themeColors.onSurfaceVariant}
                                    name="close"
                                    size={22}
                                />
                            )}
                            onPress={onCloseDetail}
                            style={styles.modalCloseButton}
                        />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                        style={styles.modalScroll}
                    >
                        <DetailContent
                            bodyMassIndex={bodyMassIndex}
                            displayName={displayName}
                            goals={goals}
                            notificationPreferences={notificationPreferences}
                            onToggleNotification={onToggleNotification}
                            onTogglePrivacy={onTogglePrivacy}
                            palette={palette}
                            privacyPreferences={privacyPreferences}
                            selectedSetting={selectedSetting}
                            userEmail={userEmail}
                            userProfile={userProfile}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </Portal>
    )
}
