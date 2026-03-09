import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { Dispatch, SetStateAction } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import { Card, IconButton, ProgressBar, Text } from 'react-native-paper'

import { styles } from './styles'
import type {
    AchievementEntry,
    GoalEntry,
    WeeklyEntry,
} from './types'

type ProfileOverviewProps = {
    achievements: AchievementEntry[]
    averageCalories: number
    displayName: string
    goals: GoalEntry[]
    onOpenSettings: () => void
    palette: ReturnType<typeof import('./styles').getProfilePalette>
    selectedDay: WeeklyEntry
    setSelectedDay: Dispatch<SetStateAction<WeeklyEntry>>
    themeColors: {
        onSurfaceVariant: string
        primary: string
    }
    userEmail: string | null
    weekData: WeeklyEntry[]
}

export function ProfileOverview({
    achievements,
    averageCalories,
    displayName,
    goals,
    onOpenSettings,
    palette,
    selectedDay,
    setSelectedDay,
    themeColors,
    userEmail,
    weekData,
}: ProfileOverviewProps) {
    return (
        <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={[styles.banner, { backgroundColor: palette.bannerSurface }]}>
                <View style={styles.bannerTitleRow}>
                    <MaterialCommunityIcons color="#FFFFFF" name="trending-up" size={20} />
                    <Text style={styles.bannerTitle}>FoodPrint Community Impact</Text>
                </View>

                <View style={styles.bannerStats}>
                    <View style={styles.bannerStatBlock}>
                        <Text style={styles.bannerStatValue}>120,000+</Text>
                        <Text style={styles.bannerStatLabel}>
                            Users transformed their lifestyle
                        </Text>
                    </View>
                    <View style={styles.bannerStatBlock}>
                        <Text style={styles.bannerStatValue}>850K lbs</Text>
                        <Text style={styles.bannerStatLabel}>
                            Total weight lost together
                        </Text>
                    </View>
                </View>
            </View>

            <Card style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
                <Card.Content style={styles.sectionContent}>
                    <View style={styles.profileHeader}>
                        <Image
                            source={{
                                uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
                            }}
                            style={styles.profileImage}
                        />
                        <View style={styles.profileCopy}>
                            <Text style={styles.profileName}>{displayName}</Text>
                            <Text style={[styles.profileMeta, { color: palette.mutedText }]}>
                                {userEmail ?? 'No email available'}
                            </Text>
                            <Text style={[styles.profileMeta, { color: palette.mutedText }]}>
                                Member since Jan 2025
                            </Text>
                        </View>
                        <IconButton
                            icon={() => (
                                <MaterialCommunityIcons
                                    color={themeColors.onSurfaceVariant}
                                    name="account-outline"
                                    size={24}
                                />
                            )}
                            onPress={onOpenSettings}
                        />
                    </View>

                    <View style={styles.statsGrid}>
                        {[
                            { icon: 'trophy-outline', label: 'Achievements', value: '24' },
                            { icon: 'target', label: 'Goals Met', value: '18/30' },
                            { icon: 'calendar-month-outline', label: 'Days Active', value: '45' },
                        ].map((item) => (
                            <View key={item.label} style={styles.statItem}>
                                <View
                                    style={[
                                        styles.statIcon,
                                        { backgroundColor: palette.accentSurface },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        color={themeColors.primary}
                                        name={item.icon}
                                        size={24}
                                    />
                                </View>
                                <Text style={styles.statValue}>{item.value}</Text>
                                <Text style={[styles.statLabel, { color: palette.mutedText }]}>
                                    {item.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card.Content>
            </Card>

            <Card style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
                <Card.Content style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Weekly Overview</Text>
                        <MaterialCommunityIcons color="#4CAF50" name="trending-up" size={20} />
                    </View>

                    <View style={styles.chartRow}>
                        {weekData.map((item) => {
                            const isActive = item.day === selectedDay.day
                            const height = Math.max(34, Math.round((item.calories / 2200) * 126))

                            return (
                                <Pressable
                                    key={item.day}
                                    onPress={() => setSelectedDay(item)}
                                    style={styles.chartColumn}
                                >
                                    <Text style={[styles.chartValue, { color: palette.mutedText }]}>
                                        {item.calories}
                                    </Text>
                                    <View
                                        style={[
                                            styles.chartTrack,
                                            { backgroundColor: palette.chartTrack },
                                        ]}
                                    >
                                        {/* eslint-disable-next-line react-native/no-inline-styles */}
                                        <View
                                            style={[
                                                styles.chartBar,
                                                {
                                                    backgroundColor: isActive
                                                        ? palette.activeBar
                                                        : palette.inactiveBar,
                                                    height,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.chartDay, { color: palette.mutedText }]}>
                                        {item.day}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>

                    <View
                        style={[
                            styles.chartSummary,
                            { backgroundColor: palette.detailAccent },
                        ]}
                    >
                        <Text style={styles.chartSummaryTitle}>{selectedDay.day} intake</Text>
                        <Text
                            style={[
                                styles.chartSummaryValue,
                                { color: palette.detailHighlight },
                            ]}
                        >
                            {selectedDay.calories} calories
                        </Text>
                    </View>

                    <Text style={[styles.averageText, { color: palette.mutedText }]}>
                        Average:{' '}
                        <Text style={[styles.averageValue, { color: palette.detailHighlight }]}>
                            {averageCalories} cal/day
                        </Text>
                    </Text>
                </Card.Content>
            </Card>

            <Card style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
                <Card.Content style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Current Goals</Text>
                    <View style={styles.goalList}>
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
                    </View>
                </Card.Content>
            </Card>

            <Card style={[styles.sectionCard, { backgroundColor: palette.surface }]}>
                <Card.Content style={styles.sectionContent}>
                    <Text style={styles.sectionTitle}>Recent Achievements</Text>
                    <View style={styles.achievementList}>
                        {achievements.map((item) => (
                            <View
                                key={item.title}
                                style={[
                                    styles.achievementCard,
                                    { backgroundColor: palette.accentSurface },
                                ]}
                            >
                                <View style={styles.achievementIcon}>
                                    <MaterialCommunityIcons color="#FFFFFF" name={item.icon} size={24} />
                                </View>
                                <View style={styles.achievementCopy}>
                                    <Text style={styles.achievementTitle}>{item.title}</Text>
                                    <Text
                                        style={[
                                            styles.achievementSubtitle,
                                            { color: palette.mutedText },
                                        ]}
                                    >
                                        {item.subtitle}
                                    </Text>
                                </View>
                                <Text
                                    style={[styles.achievementTime, { color: palette.mutedText }]}
                                >
                                    {item.time}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    )
}
