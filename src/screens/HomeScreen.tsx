import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import React from 'react'
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'

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
interface MealItem {
    id: string
    name: string
    mealType: string
    time: string
    calories: number
    icon: keyof typeof MaterialCommunityIcons.glyphMap
}

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_MEALS: MealItem[] = [
    {
        id: '1',
        name: 'Oatmeal with berries',
        mealType: 'Breakfast',
        time: '8:30 AM',
        calories: 320,
        icon: 'coffee',
    },
    {
        id: '2',
        name: 'Grilled chicken salad',
        mealType: 'Lunch',
        time: '12:45 PM',
        calories: 450,
        icon: 'silverware-fork-knife',
    },
    {
        id: '3',
        name: 'Greek yogurt',
        mealType: 'Snack',
        time: '3:20 PM',
        calories: 150,
        icon: 'apple',
    },
]

const CALORIE_CURRENT = 920
const CALORIE_GOAL = 2000
const CALORIE_REMAINING = CALORIE_GOAL - CALORIE_CURRENT
const MACROS = [
    { label: 'Protein', value: '45g' },
    { label: 'Carbs', value: '120g' },
    { label: 'Fat', value: '28g' },
]

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
                
                {/* Percentage text */}
                <SvgText
                    x={size / 2}
                    y={size / 2}
                    textAnchor="middle"
                    dy="0.3em"
                    fontSize="14"
                    fontWeight="600"
                    fill={COLORS.dark}
                >
                    {Math.round(pct * 100)}%
                </SvgText>
            </Svg>
        </View>
    )
}

const ringStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
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

// ─── Handlers ────────────────────────────────────────────────
// 👉 如果要跳转到 Record 页面，把下面这行改为：
//    const handleAddMeal = () => navigation.navigate('Record')
//    并在 HomeScreen 的参数中接收 navigation prop 或使用 useNavigation()
const handleAddMeal = () => {
    console.log('Add Meal')
}

const handleChatPress = () => {
    console.log('Chat pressed')
}

// ─── Main Component ──────────────────────────────────────────
export function HomeScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with white background */}
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>FoodPrint</Text>
                </View>

                {/* ── Calorie Card ── */}
                <View style={[styles.calorieCard, { marginHorizontal: 16 }]}>
                    <View style={styles.calorieTop}>
                        {/* Left info */}
                        <View style={styles.calorieLeft}>
                            <Text style={styles.calorieLabel}>
                                Today's Calories
                            </Text>
                            <View style={styles.calorieRow}>
                                <Text style={styles.calorieCurrent}>
                                    {CALORIE_CURRENT}
                                </Text>
                                <Text style={styles.calorieGoal}>
                                    {' '}
                                    / {CALORIE_GOAL}
                                </Text>
                            </View>
                            <Text style={styles.calorieRemaining}>
                                {CALORIE_REMAINING} cal remaining
                            </Text>
                        </View>
                    </View>

                    {/* Ring - positioned absolutely */}
                    <View style={styles.ringContainer}>
                        <CalorieRing
                            progress={CALORIE_CURRENT / CALORIE_GOAL}
                        />
                    </View>

                    {/* Macros */}
                    <View style={styles.macroRow}>
                        {MACROS.map((m) => (
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

                {/* ── Section Header ── */}
                <View style={[styles.sectionHeader, { marginHorizontal: 16 }]}>
                    <Text style={styles.sectionTitle}>Today's Meals</Text>
                    <Pressable>
                        <Text style={styles.viewAll}>View All</Text>
                    </Pressable>
                </View>

                {/* ── Meal List ── */}
                <View style={{ paddingHorizontal: 16 }}>
                    {MOCK_MEALS.map((meal) => (
                        <MealItemCard key={meal.id} meal={meal} />
                    ))}
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
                        <Text style={styles.addMealText}>+ Add Meal</Text>
                    </Pressable>
                </View>

                {/* Bottom spacer so content doesn't hide behind FAB */}
                <View style={{ height: 70 }} />
            </ScrollView>

            {/* ── Floating Chat Button ── */}
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    pressed && styles.fabPressed,
                ]}
                onPress={handleChatPress}
            >
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#fff"
                />
            </Pressable>
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

    // ── Header ──
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

    // ── FAB (Chat) ──
    fab: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 26,
        bottom: 32,
        elevation: 4,
        height: 52,
        justifyContent: 'center',
        position: 'absolute',
        right: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        width: 52,
    },
    fabPressed: {
        backgroundColor: COLORS.primaryDark,
    },
})
