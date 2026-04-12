import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import React, { useCallback, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'

import { analyze } from '../api/ai'
import { ApiError } from '../api/client'
import {
    buildLast7DaySlots,
    createFoodLog,
    getFoodLogsByDate,
    getWeeklyOverview,
    mergeWeeklyIntoSlots,
    parseWeeklyOverviewPayload,
    toYMD,
} from '../api/food'
import type { DailyCalorieBarDto, FoodLogDto, UserNutritionContext } from '../api/types'
import { StreamingAssistantMarkdown } from '../components/common/StreamingAssistantMarkdown'
import { FloatingChatButton } from '../components/common/FloatingChatButton'
import { useAuth } from '../context/AuthContext'

// ─── Colors ──────────────────────────────────────────────────
const COLORS = {
    bg: '#F4F7F2',
    card: '#FFFFFF',
    primary: '#97B08A',
    primaryDark: '#7A9A6D',
    dark: '#1D3557',
    sub: '#7D8A97',
    remaining: '#5B9A50',
    iconBg: '#E8F0E4',
    shadow: '#000',
}

// ─── Types ───────────────────────────────────────────────────
type RootTabParamList = {
    Home: undefined
    Record: { initialMode?: 'text' } | undefined
    Community: undefined
    Profile: undefined
}

type HomeScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>

interface MealItem {
    id: string
    name: string
    mealType: string
    time: string
    calories: number
    icon: keyof typeof MaterialCommunityIcons.glyphMap
}

interface ChatMessage {
    id: string
    text: string
    sender: 'user' | 'assistant'
    timestamp: Date
}

const DEFAULT_CALORIE_GOAL = 2000

function foodLogToMeal(log: FoodLogDto): MealItem {
    const n = log.nutritionData
    const cal = Math.round(
        n?.calories ?? (typeof log.todayCalories === 'number' ? log.todayCalories : 0)
    )
    const rawName =
        (log.text && log.text.trim()) ||
        (log.recognizedFoods?.filter(Boolean).join(', ') || '')
    const name = rawName.length > 0 ? rawName : 'Food entry'
    let time = ''
    if (log.createdAt) {
        try {
            time = new Date(log.createdAt).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
            })
        } catch {
            time = ''
        }
    }
    const short = name.length > 80 ? `${name.slice(0, 77)}...` : name
    return {
        id: log.id,
        name: short,
        mealType: 'Logged',
        time: time || '—',
        calories: cal,
        icon: 'silverware-fork-knife',
    }
}

function shortWeekdayLabel(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    if (!y || !m || !d) return '?'
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString(undefined, { weekday: 'short' })
}

function WeeklyCalorieHistogram({
    bars,
    calorieGoal,
    loading,
}: {
    bars: DailyCalorieBarDto[]
    calorieGoal: number
    loading: boolean
}) {
    const maxCal = useMemo(() => {
        const peak = Math.max(1, calorieGoal, ...bars.map((b) => b.totalCalories))
        return peak * 1.08
    }, [bars, calorieGoal])

    const barMaxH = 104

    return (
        <View style={styles.histogramCard}>
            <View style={styles.histogramHeader}>
                <Text style={styles.histogramTitle}>7-day calories</Text>
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : null}
            </View>
            <View style={styles.histogramRow}>
                {bars.map((bar) => {
                    const ratio = maxCal > 0 ? bar.totalCalories / maxCal : 0
                    const fillH = loading
                        ? 16
                        : bar.totalCalories > 0
                          ? Math.max(10, ratio * barMaxH)
                          : 6
                    const fillOpacity = loading ? 0.35 : bar.totalCalories > 0 ? 1 : 0.45
                    return (
                        <View key={bar.date} style={styles.histogramCol}>
                            <Text style={styles.histogramCal} numberOfLines={1}>
                                {loading ? '—' : bar.totalCalories > 0 ? Math.round(bar.totalCalories) : '—'}
                            </Text>
                            <View style={styles.histogramTrack}>
                                <View
                                    style={[
                                        styles.histogramFill,
                                        { height: fillH, opacity: fillOpacity },
                                    ]}
                                />
                            </View>
                            <Text style={styles.histogramDay}>{shortWeekdayLabel(bar.date)}</Text>
                        </View>
                    )
                })}
            </View>
        </View>
    )
}

// ─── Helpers ─────────────────────────────────────────────────

/** SVG-based ring progress indicator */
function CalorieRing({ progress }: { progress: number }) {
    const size = 80
    const strokeWidth = 7
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const pct = Math.min(progress, 1)
    const strokeDashoffset = circumference * (1 - pct)

    return (
        <View style={ringStyles.container}>
            <Svg width={size} height={size}>
                {/* Background ring */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E8F0E4"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress ring */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={COLORS.primary}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* 修复46%文本真正居中 - 使用绝对定位容器覆盖SVG */}
            <View style={ringStyles.textContainer}>
                <Text style={ringStyles.percentageText}>
                    {Math.round(pct * 100)}%
                </Text>
            </View>
        </View>
    )
}

const ringStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,      // 明确外层容器尺寸
        height: 80,
        position: 'relative',
    },
    // 修复46%文本真正居中 - 绝对定位文本容器
    textContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        left: 0,
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
        textAlign: 'center',
    },
})

// ─── Meal Item Renderer ──────────────────────────────────────
function MealItemCard({ meal }: { meal: MealItem }) {
    return (
        <View style={styles.mealCard}>
            {/* Icon */}
            <View style={styles.mealIconBox}>
                <MaterialCommunityIcons
                    name={meal.icon}
                    size={20}
                    color={COLORS.primary}
                />
            </View>

            {/* Info */}
            <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMeta}>
                    {meal.mealType} • {meal.time}
                </Text>
            </View>

            {/* Calories */}
            <View style={styles.mealCalories}>
                <Text style={styles.mealCalNum}>{meal.calories}</Text>
                <Text style={styles.mealCalUnit}>cal</Text>
            </View>
        </View>
    )
}

// ─── Chat Modal Component ──────────────────────────────────────────
function ChatModal({
    visible,
    onClose,
    messages,
    inputText,
    onInputChange,
    onSendMessage,
    sending = false,
}: {
    visible: boolean
    onClose: () => void
    messages: ChatMessage[]
    inputText: string
    onInputChange: (text: string) => void
    onSendMessage: () => void
    sending?: boolean
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.chatOverlay}>
                <View style={styles.chatContainer}>
                    {/* Header */}
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle}>AI Chat</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.dark} />
                        </Pressable>
                    </View>

                    {/* Messages */}
                    <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
                        {messages.map((message) => (
                            <View
                                key={message.id}
                                style={[
                                    styles.messageContainer,
                                    message.sender === 'user' ? styles.userMessage : styles.assistantMessage,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        message.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                                    ]}
                                >
                                    {message.sender === 'user' ? (
                                        <Text
                                            style={[styles.messageText, styles.userText]}
                                        >
                                            {message.text}
                                        </Text>
                                    ) : (
                                        <StreamingAssistantMarkdown
                                            markdown={message.text}
                                            textColor={COLORS.dark}
                                            linkColor={COLORS.primary}
                                        />
                                    )}
                                </View>
                            </View>
                        ))}
                        {sending ? (
                            <View style={[styles.messageContainer, styles.assistantMessage]}>
                                <View
                                    style={[
                                        styles.messageBubble,
                                        styles.assistantBubble,
                                        styles.thinkingBubble,
                                    ]}
                                >
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                    <Text style={[styles.messageText, styles.assistantText, styles.thinkingLabel]}>
                                        Thinking...
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.chatInputArea}>
                        <TextInput
                            style={styles.chatInput}
                            value={inputText}
                            onChangeText={onInputChange}
                            placeholder="Ask about your meals..."
                            placeholderTextColor={COLORS.sub}
                            multiline
                            maxLength={500}
                        />
                        <Pressable
                            style={[
                                styles.sendButton,
                                (!inputText.trim() || sending) && styles.sendButtonDisabled,
                            ]}
                            onPress={onSendMessage}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={18}
                                    color={inputText.trim() && !sending ? '#fff' : COLORS.sub}
                                />
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

// ─── Handlers ────────────────────────────────────────────────
// 在 HomeScreen 组件内部定义这些函数

// ─── Main Component ──────────────────────────────────────────
export function HomeScreen() {
    const _navigation = useNavigation<HomeScreenNavigationProp>()
    const { userProfile } = useAuth()

    const calorieGoal = userProfile?.dailyCalories ?? DEFAULT_CALORIE_GOAL

    const userContext: UserNutritionContext | undefined = userProfile
        ? {
            heightCm: userProfile.height,
            weightKg: userProfile.weight,
            age: userProfile.age,
            gender: userProfile.gender,
            goal: userProfile.goal,
            dailyCalorieTarget: userProfile.dailyCalories,
        }
        : undefined

    const [weeklyBars, setWeeklyBars] = useState<DailyCalorieBarDto[]>(() =>
        buildLast7DaySlots(new Date())
    )
    const [todayLogs, setTodayLogs] = useState<FoodLogDto[]>([])
    const [weeklyLoading, setWeeklyLoading] = useState(true)
    const [logsLoading, setLogsLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [viewAllVisible, setViewAllVisible] = useState(false)
    const [addMealVisible, setAddMealVisible] = useState(false)
    const [newMealDesc, setNewMealDesc] = useState('')
    const [savingLog, setSavingLog] = useState(false)

    const [chatVisible, setChatVisible] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [sendingMessage, setSendingMessage] = useState(false)

    const meals = useMemo(() => todayLogs.map(foodLogToMeal), [todayLogs])

    const todayYmd = toYMD(new Date())

    const macroTotals = useMemo(() => {
        return todayLogs.reduce(
            (acc, log) => {
                const n = log.nutritionData
                if (!n) return acc
                const p = n.protein ?? n.proteinG ?? 0
                return {
                    protein: acc.protein + p,
                    fat: acc.fat + (n.fat ?? 0),
                    carbs: acc.carbs + (n.carbs ?? 0),
                }
            },
            { protein: 0, fat: 0, carbs: 0 }
        )
    }, [todayLogs])

    const macroDisplay = useMemo(
        () => [
            {
                label: 'Protein',
                value: logsLoading ? '—' : `${Math.round(macroTotals.protein)}g`,
            },
            {
                label: 'Carbs',
                value: logsLoading ? '—' : `${Math.round(macroTotals.carbs)}g`,
            },
            {
                label: 'Fat',
                value: logsLoading ? '—' : `${Math.round(macroTotals.fat)}g`,
            },
        ],
        [logsLoading, macroTotals]
    )

    const totalFromLogs = useMemo(
        () => meals.reduce((sum, m) => sum + m.calories, 0),
        [meals]
    )

    const todayBarCalories = useMemo(() => {
        const hit = weeklyBars.find((b) => b.date === todayYmd)
        return hit?.totalCalories ?? 0
    }, [weeklyBars, todayYmd])

    const totalCalories =
        totalFromLogs > 0 ? totalFromLogs : todayBarCalories

    const remainingCalories = calorieGoal - totalCalories

    const loadHomeData = useCallback(async (isPull = false) => {
        const end = new Date()
        const endStr = toYMD(end)
        if (isPull) setRefreshing(true)
        else {
            setWeeklyLoading(true)
            setLogsLoading(true)
        }

        try {
            const [weeklyRes, logsRes] = await Promise.allSettled([
                getWeeklyOverview(endStr),
                getFoodLogsByDate(endStr),
            ])

            const slots = buildLast7DaySlots(end)

            if (weeklyRes.status === 'fulfilled' && weeklyRes.value.data != null) {
                const parsed = parseWeeklyOverviewPayload(weeklyRes.value.data)
                setWeeklyBars(mergeWeeklyIntoSlots(slots, parsed))
            } else {
                setWeeklyBars(slots)
            }

            if (logsRes.status === 'fulfilled' && logsRes.value.data != null) {
                const raw = logsRes.value.data
                setTodayLogs(Array.isArray(raw) ? raw : [])
            } else {
                setTodayLogs([])
            }
        } catch {
            setWeeklyBars(buildLast7DaySlots(end))
            setTodayLogs([])
        } finally {
            setWeeklyLoading(false)
            setLogsLoading(false)
            setRefreshing(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadHomeData(false)
        }, [loadHomeData])
    )

    const handleViewAll = () => {
        setViewAllVisible(true)
    }

    const handleCloseViewAll = () => {
        setViewAllVisible(false)
    }

    const handleAddMeal = () => {
        setAddMealVisible(true)
    }

    const handleCloseAddMeal = () => {
        setAddMealVisible(false)
        setNewMealDesc('')
    }

    const handleSaveMeal = async () => {
        const text = newMealDesc.trim()
        if (!text) {
            Alert.alert('Notice', 'Please describe what you ate')
            return
        }
        setSavingLog(true)
        try {
            await createFoodLog({
                text,
                date: toYMD(new Date()),
            })
            handleCloseAddMeal()
            await loadHomeData(false)
        } catch (e: unknown) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : 'Could not save meal'
            Alert.alert('Error', msg)
        } finally {
            setSavingLog(false)
        }
    }

    const handleChatPress = () => {
        setChatVisible(true)
    }

    const handleCloseChat = () => {
        setChatVisible(false)
    }

    const handleSendMessage = async () => {
        const messageText = chatInput.trim()
        if (!messageText) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'user',
            timestamp: new Date(),
        }
        setChatMessages(prev => [...prev, userMessage])
        setChatInput('')
        setSendingMessage(true)

        try {
            const res = await analyze({ text: messageText, userContext })
            const data = res.data
            let reply: string

            if (!data) {
                reply = 'No response from AI'
            } else if (data.type === 'PROFILE_NEEDED' && data.profilePrompt) {
                reply = data.profilePrompt
            } else if (data.adviceText) {
                reply = data.adviceText
            } else if (data.type === 'FOOD_ANALYSIS' && data.foodAnalysis) {
                const s = data.foodAnalysis.summary
                const foods =
                    data.foodAnalysis.foods?.map(f => f.nameEn || f.nameZh).join(', ') || ''
                reply = `Detected: ${foods}\nCalories: ${s?.totalCalories ?? '-'} kcal | Protein: ${s?.totalProteinG ?? '-'}g | Fat: ${s?.totalFatG ?? '-'}g | Carbs: ${s?.totalCarbsG ?? '-'}g`
            } else {
                reply = res.message || 'No response from AI'
            }
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: reply,
                sender: 'assistant',
                timestamp: new Date(),
            }
            setChatMessages(prev => [...prev, assistantMessage])
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Unknown error'
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: `Error: ${msg}`,
                sender: 'assistant',
                timestamp: new Date(),
            }
            setChatMessages(prev => [...prev, assistantMessage])
        } finally {
            setSendingMessage(false)
        }
    }
    const goalForRing = Math.max(1, calorieGoal)

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadHomeData(true)}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Header with white background - 修复安卓模拟器遮挡问题 */}
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>FoodPrint</Text>
                </View>

                {/* ── Calorie Card ── */}
                <View style={[styles.calorieCard, { marginHorizontal: 16 }]}>
                    <View style={styles.calorieTop}>
                        {/* Left info */}
                        <View style={styles.calorieLeft}>
                            <Text style={styles.calorieLabel}>
                                Today&apos;s Calories
                            </Text>
                            <View style={styles.calorieRow}>
                                <Text style={styles.calorieCurrent}>
                                    {logsLoading ? '—' : totalCalories}
                                </Text>
                                <Text style={styles.calorieGoal}>
                                    {' '}
                                    / {calorieGoal}
                                </Text>
                            </View>
                            <Text style={styles.calorieRemaining}>
                                {logsLoading ? '…' : `${remainingCalories} cal remaining`}
                            </Text>
                        </View>
                    </View>

                    {/* Ring - positioned absolutely */}
                    <View style={styles.ringContainer}>
                        <CalorieRing
                            progress={logsLoading ? 0 : totalCalories / goalForRing}
                        />
                    </View>

                    {/* Macros */}
                    <View style={styles.macroRow}>
                        {macroDisplay.map((m) => (
                            <View key={m.label} style={styles.macroItem}>
                                <Text style={styles.macroValue}>
                                    {m.value}
                                </Text>
                                <Text style={styles.macroLabel}>
                                    {m.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── 7-day histogram ── */}
                <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                    <WeeklyCalorieHistogram
                        bars={weeklyBars}
                        calorieGoal={calorieGoal}
                        loading={weeklyLoading}
                    />
                </View>

                {/* ── Section Header ── */}
                <View style={[styles.sectionHeader, { marginHorizontal: 16 }]}>
                    <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
                    <Pressable onPress={handleViewAll}>
                        <Text style={styles.viewAll}>View All</Text>
                    </Pressable>
                </View>

                {/* ── Meal List (placeholder + data) ── */}
                <View style={{ paddingHorizontal: 16 }}>
                    {logsLoading ? (
                        <>
                            <View style={[styles.mealCard, styles.mealPlaceholder]}>
                                <View style={styles.mealIconBox}>
                                    <ActivityIndicator color={COLORS.sub} />
                                </View>
                                <View style={styles.mealInfo}>
                                    <View style={styles.skeletonLine} />
                                    <View style={[styles.skeletonLine, { width: '50%', marginTop: 8 }]} />
                                </View>
                            </View>
                            <View style={[styles.mealCard, styles.mealPlaceholder]}>
                                <View style={styles.mealIconBox}>
                                    <MaterialCommunityIcons
                                        name="food"
                                        size={20}
                                        color={COLORS.sub}
                                    />
                                </View>
                                <View style={styles.mealInfo}>
                                    <View style={styles.skeletonLine} />
                                    <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
                                </View>
                            </View>
                        </>
                    ) : meals.length === 0 ? (
                        <View style={styles.emptyMeals}>
                            <MaterialCommunityIcons
                                name="silverware-fork-knife"
                                size={36}
                                color={COLORS.sub}
                            />
                            <Text style={styles.emptyMealsTitle}>No meals yet</Text>
                            <Text style={styles.emptyMealsSub}>
                                Log what you ate — AI will estimate nutrition.
                            </Text>
                        </View>
                    ) : (
                        meals.map((meal) => <MealItemCard key={meal.id} meal={meal} />)
                    )}
                </View>

                {/* ── Add Meal Button ── */}
                <View style={{ paddingHorizontal: 16 }}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.addMealBtn,
                            pressed && styles.addMealBtnPressed,
                        ]}
                        onPress={handleAddMeal}
                    >
                        <Text style={styles.addMealText}>+ Log meal (AI)</Text>
                    </Pressable>
                </View>

                {/* Bottom spacer so content doesn't hide behind FAB */}
                <View style={{ height: 70 }} />
            </ScrollView>

            {/* ── Floating Chat Button ── */}
            <FloatingChatButton onPress={handleChatPress} />

            {/* ── Chat Modal ── */}
            <ChatModal
                visible={chatVisible}
                onClose={handleCloseChat}
                messages={chatMessages}
                inputText={chatInput}
                onInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                sending={sendingMessage}
            />

            {/* ── View All Modal ── */}
            <Modal
                visible={viewAllVisible}
                transparent
                animationType="slide"
                onRequestClose={handleCloseViewAll}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>All Meals</Text>
                            <Pressable onPress={handleCloseViewAll}>
                                <Ionicons name="close" size={24} color={COLORS.dark} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {logsLoading ? (
                                <Text style={styles.modalEmptyText}>Loading…</Text>
                            ) : meals.length === 0 ? (
                                <Text style={styles.modalEmptyText}>No meals logged today.</Text>
                            ) : (
                                meals.map((meal) => (
                                    <MealItemCard key={meal.id} meal={meal} />
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── Add Meal Modal ── */}
            <Modal
                visible={addMealVisible}
                transparent
                animationType="slide"
                onRequestClose={handleCloseAddMeal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Log meal</Text>
                            <Pressable onPress={handleCloseAddMeal} disabled={savingLog}>
                                <Ionicons name="close" size={24} color={COLORS.dark} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.formHint}>
                                Describe what you ate. We&apos;ll send it to the server for AI
                                analysis and save today&apos;s entry.
                            </Text>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Description</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textInputMultiline]}
                                    value={newMealDesc}
                                    onChangeText={setNewMealDesc}
                                    placeholder="e.g. Two eggs, whole wheat toast, black coffee"
                                    placeholderTextColor={COLORS.sub}
                                    multiline
                                    editable={!savingLog}
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <Pressable
                                    style={[styles.modalBtn, styles.modalBtnCancel]}
                                    onPress={handleCloseAddMeal}
                                    disabled={savingLog}
                                >
                                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.modalBtn,
                                        styles.modalBtnSave,
                                        savingLog && styles.modalBtnDisabled,
                                    ]}
                                    onPress={() => void handleSaveMeal()}
                                    disabled={savingLog}
                                >
                                    {savingLog ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.modalBtnSaveText}>Save</Text>
                                    )}
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    // ── Layout ──
    safe: {
        backgroundColor: COLORS.bg,
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 0,
        paddingTop: 0,
    },

    // ── Header - 修复顶部被遮挡问题 ──
    headerContainer: {
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
        marginBottom: 16,
    },
    header: {
        color: COLORS.dark,
        fontSize: 28,
        fontWeight: '800',
    },

    // ── Calorie Card ──
    calorieCard: {
        backgroundColor: COLORS.card,
        borderRadius: 22,
        elevation: 2,
        marginBottom: 16,
        padding: 20,
        position: 'relative',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    calorieGoal: {
        color: COLORS.sub,
        fontSize: 18,
        fontWeight: '500',
    },
    calorieLabel: {
        color: COLORS.sub,
        fontSize: 13,
        marginBottom: 4,
    },
    calorieLeft: {
        flex: 1,
    },
    calorieRemaining: {
        color: COLORS.remaining,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
    },
    calorieRow: {
        alignItems: 'baseline',
        flexDirection: 'row',
    },
    calorieTop: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    calorieCurrent: {
        color: COLORS.dark,
        fontSize: 38,
        fontWeight: '800',
    },

    // ── Ring Container ──
    ringContainer: {
        position: 'absolute',
        top: 20,
        right: 22,
    },

    // ── Macros ──
    macroItem: {
        alignItems: 'center',
        flex: 1,
    },
    macroLabel: {
        color: COLORS.sub,
        fontSize: 12,
        marginTop: 2,
    },
    macroRow: {
        flexDirection: 'row',
        paddingTop: 16,
    },
    macroValue: {
        color: COLORS.dark,
        fontSize: 16,
        fontWeight: '700',
    },

    // ── 7-day histogram ──
    histogramCard: {
        backgroundColor: COLORS.card,
        borderRadius: 18,
        elevation: 1,
        padding: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    histogramCal: {
        color: COLORS.dark,
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 6,
        textAlign: 'center',
    },
    histogramCol: {
        alignItems: 'center',
        flex: 1,
    },
    histogramDay: {
        color: COLORS.sub,
        fontSize: 11,
        fontWeight: '500',
        marginTop: 6,
    },
    histogramFill: {
        backgroundColor: COLORS.primary,
        borderRadius: 5,
        minHeight: 4,
        width: '72%',
    },
    histogramHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    histogramRow: {
        alignItems: 'flex-end',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 132,
    },
    histogramTitle: {
        color: COLORS.dark,
        fontSize: 16,
        fontWeight: '700',
    },
    histogramTrack: {
        alignItems: 'center',
        backgroundColor: COLORS.iconBg,
        borderRadius: 6,
        height: 112,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        width: '100%',
    },

    emptyMeals: {
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        marginBottom: 10,
        paddingHorizontal: 16,
        paddingVertical: 28,
    },
    emptyMealsSub: {
        color: COLORS.sub,
        fontSize: 14,
        marginTop: 6,
        textAlign: 'center',
    },
    emptyMealsTitle: {
        color: COLORS.dark,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    mealPlaceholder: {
        opacity: 0.85,
    },
    skeletonLine: {
        backgroundColor: '#E4E9E0',
        borderRadius: 4,
        height: 14,
        width: '70%',
    },

    // ── Section Header ──
    sectionHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        color: COLORS.dark,
        fontSize: 17,
        fontWeight: '600',
    },
    viewAll: {
        color: '#A3C19B',
        fontSize: 14,
        fontWeight: '500',
    },

    // ── Meal Card ──
    mealCalNum: {
        color: COLORS.dark,
        fontSize: 16,
        fontWeight: '700',
    },
    mealCalUnit: {
        color: COLORS.sub,
        fontSize: 12,
    },
    mealCalories: {
        alignItems: 'flex-end',
    },
    mealCard: {
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        elevation: 1,
        flexDirection: 'row',
        marginBottom: 10,
        padding: 12,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
    },
    mealIconBox: {
        alignItems: 'center',
        backgroundColor: COLORS.iconBg,
        borderRadius: 10,
        height: 40,
        justifyContent: 'center',
        marginRight: 12,
        width: 40,
    },
    mealInfo: {
        flex: 1,
    },
    mealMeta: {
        color: '#9BA3A8',
        fontSize: 12,
        marginTop: 2,
    },
    mealName: {
        color: COLORS.dark,
        fontSize: 15,
        fontWeight: '500',
    },

    // ── Add Meal Button ──
    addMealBtn: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        justifyContent: 'center',
        marginTop: 6,
        paddingVertical: 14,
    },
    addMealBtnPressed: {
        backgroundColor: COLORS.primaryDark,
    },
    addMealText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // ── FAB (Chat) ── (现在由 FloatingChatButton 组件处理)
    // fab styles 已移至 FloatingChatButton 组件

    // ── Modal Styles ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        color: COLORS.dark,
        fontSize: 20,
        fontWeight: '700',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },

    // ── Form Styles ──
    formGroup: {
        marginBottom: 20,
    },
    formHint: {
        color: COLORS.sub,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    formLabel: {
        color: COLORS.dark,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: COLORS.dark,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textInputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnCancel: {
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    modalBtnSave: {
        backgroundColor: COLORS.primary,
    },
    modalBtnDisabled: {
        opacity: 0.65,
    },
    modalEmptyText: {
        color: COLORS.sub,
        fontSize: 15,
        paddingVertical: 24,
        textAlign: 'center',
    },
    modalBtnCancelText: {
        color: COLORS.sub,
        fontSize: 16,
        fontWeight: '600',
    },
    modalBtnSaveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // ── Chat Styles ──
    chatOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    chatContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        maxHeight: '80%',
        minHeight: '60%',
        overflow: 'hidden',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: COLORS.card,
    },
    chatTitle: {
        color: COLORS.dark,
        fontSize: 20,
        fontWeight: '700',
    },
    chatMessages: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        marginBottom: 12,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    assistantMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: COLORS.iconBg,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
    },
    assistantText: {
        color: COLORS.dark,
    },
    thinkingBubble: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        minWidth: 120,
    },
    thinkingLabel: {
        fontSize: 14,
        opacity: 0.85,
    },
    chatInputArea: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 12,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        alignItems: 'flex-end',
    },
    chatInput: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: COLORS.dark,
        maxHeight: 80,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.iconBg,
    },
})
