import type { UserProfile } from '../../context/AuthContext'
import type {
    AchievementEntry,
    GoalEntry,
    SettingsEntry,
    WeeklyEntry,
} from './types'

export const weekData: WeeklyEntry[] = [
    { day: 'Mon', calories: 1850 },
    { day: 'Tue', calories: 2100 },
    { day: 'Wed', calories: 1920 },
    { day: 'Thu', calories: 2050 },
    { day: 'Fri', calories: 1880 },
    { day: 'Sat', calories: 2200 },
    { day: 'Sun', calories: 1950 },
]

export const achievements: AchievementEntry[] = [
    {
        icon: 'trophy-outline',
        subtitle: 'Logged meals for 7 days in a row',
        time: 'Today',
        title: '7-Day Streak',
    },
    {
        icon: 'target',
        subtitle: 'Met the calorie target 5 times this week',
        time: '2 days ago',
        title: 'Goal Crusher',
    },
]

export function getDisplayName(email: string | null) {
    if (!email) {
        return 'Alex Thompson'
    }

    const localPart = email.split('@')[0] ?? ''
    const words = localPart
        .split(/[._-]/)
        .map((part) => part.trim())
        .filter(Boolean)

    if (words.length === 0) {
        return email
    }

    return words
        .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

export function formatActivityLevel(level: 'low' | 'medium' | 'high' | undefined) {
    if (!level) {
        return 'Moderate activity'
    }

    if (level === 'low') {
        return 'Light activity'
    }

    if (level === 'high') {
        return 'High activity'
    }

    return 'Moderate activity'
}

export function formatGoal(goal: 'lose' | 'maintain' | 'gain' | undefined) {
    if (!goal) {
        return 'Maintain weight'
    }

    if (goal === 'lose') {
        return 'Lose weight'
    }

    if (goal === 'gain') {
        return 'Gain muscle'
    }

    return 'Maintain weight'
}

export function getGoals(userProfile: UserProfile | null): GoalEntry[] {
    return [
        {
            current: `${userProfile?.dailyCalories ?? 2000} cal`,
            label: 'Daily Calorie Target',
            progress: 0.92,
        },
        {
            current: `${Math.max(90, Math.round((userProfile?.weight ?? 75) * 2))}g`,
            label: 'Protein Intake',
            progress: 0.75,
        },
        {
            current: '8 glasses',
            label: 'Water Intake',
            progress: 0.62,
        },
    ]
}

export function getSettingsEntries(userProfile: UserProfile | null): SettingsEntry[] {
    return [
        {
            description: 'Name, email, and contact',
            icon: 'account-circle-outline',
            title: 'Personal Information',
        },
        {
            description: userProfile
                ? `Weight: ${userProfile.weight}kg • Height: ${userProfile.height}cm`
                : 'Weight and height details',
            icon: 'scale-bathroom',
            title: 'Body Metrics',
        },
        {
            description: userProfile
                ? `${userProfile.goal} goal • ${userProfile.dailyCalories} kcal target`
                : 'Set your fitness targets',
            icon: 'heart-pulse',
            title: 'Health Goals',
        },
        {
            description: 'Manage alerts and reminders',
            icon: 'bell-outline',
            title: 'Notifications',
        },
        {
            description: 'Control your data',
            icon: 'shield-check-outline',
            title: 'Privacy & Security',
        },
        {
            description: 'Change your password',
            icon: 'lock-outline',
            title: 'Password',
        },
    ]
}
