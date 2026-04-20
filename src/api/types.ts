/**
 * 与后端统一的响应格式及 DTO 类型
 * @see 后端 README 统一响应格式
 */

/** 后端统一响应：{ code, message, data } */
export interface ApiResponse<T = unknown> {
    code: number
    message: string
    data: T | null
}

// ---------- User 模块 ----------
export interface UserProfileDto {
    id: string
    email?: string
    nickname?: string | null
    avatarUrl?: string | null
    heightCm?: number | null
    weightKg?: number | null
    age?: number | null
    gender?: string | null
    goal?: string | null
    dailyCalorieTarget?: number | null
    dietaryPreference?: string | null
    createdAt?: string
    updatedAt?: string
}

export interface UserStatsDto {
    achievements: number
    goalsMet: number
    daysActive: number
}

export interface BodyDataRequest {
    heightCm?: number
    weightKg?: number
    age?: number
    gender?: string
    goal?: string
    dailyCalorieTarget?: number
    dietaryPreference?: string
}

export interface UpdateProfileRequest {
    nickname?: string
    avatarUrl?: string
}

// ---------- Food 模块 ----------
/**
 * 创建/更新食物记录（纯数据写入；AI 推断应在调用 /api/ai 后由前端组装此对象）
 */
export interface CreateFoodLogRequest {
    text?: string
    imageUrl?: string
    date?: string // ISO date e.g. 2026-01-01
    /** 用户原始描述（可与 text 展示名不同） */
    originalText?: string | null
    recognizedFoods?: string[]
    nutritionData?: NutritionDataDto | null
    aiConfidence?: number
}

export interface NutritionDataDto {
    calories?: number
    protein?: number
    proteinG?: number
    fat?: number
    carbs?: number
    fiber?: number
    [key: string]: number | undefined
}

/**
 * GET /api/food-logs/today — Home 当日餐次简化列表
 */
export interface TodayFoodLogItemDto {
    id: string
    title: string
    foodItems: string[]
    totalCalories: number
    /** ISO-8601 */
    mealTime: string
    /** 克；与周概览字段对齐，缺省时由周概览当日条兜底 */
    totalProtein?: number
    totalFat?: number
    totalCarbs?: number
}

export interface FoodLogDto {
    id: string
    userId: string
    /** 餐次时间（前端保存时传入） */
    mealTime?: string
    /** 后端当前返回的记账日期 */
    logDate?: string
    /** 用户输入 / AI 识别的原文 */
    originalText?: string | null
    aiConfidence?: number
    /** 兼容旧字段 */
    date?: string
    text?: string | null
    imageUrl?: string | null
    recognizedFoods?: string[]
    nutritionData?: NutritionDataDto | null
    /** 与 manual 录入一致；GET /today 也可能按行返回营养 */
    foods?: FoodNutritionDetail[]
    /** AI 保存时的完整分析（宏量常在 summary 或 foods 上） */
    analysisResult?: FoodAnalysisResult | null
    todayCalories?: number
    todayProtein?: number
    todayFat?: number
    todayCarbs?: number
    createdAt?: string
    updatedAt?: string
}

export interface TodaySummaryDto {
    date: string
    totalCalories: number
    totalProtein?: number
    totalFat?: number
    totalCarbs?: number
    logCount?: number
}

/** 单日柱状图数据（周概览接口） */
export interface DailyCalorieBarDto {
    date: string
    totalCalories: number
    totalProtein?: number
    totalFat?: number
    totalCarbs?: number
    logCount?: number
}

/**
 * GET /api/food-logs/weekly-overview 的 data 可能是数组或带 days 字段的对象
 */
export type WeeklyOverviewPayload =
    | DailyCalorieBarDto[]
    | { days?: DailyCalorieBarDto[] }

// ---------- AI 模块 ----------
export interface UserNutritionContext {
    heightCm?: number
    weightKg?: number
    age?: number
    gender?: string
    goal?: string
    dailyCalorieTarget?: number
}

export interface AnalyzeRequest {
    text?: string
    imageUrl?: string
    userContext?: UserNutritionContext
}

export interface FoodNutritionDetail {
    nameEn?: string
    nameZh?: string
    portionAmount?: number
    portionUnit?: string
    calories?: number
    proteinG?: number
    fatG?: number
    carbsG?: number
    fiberG?: number
    dataSource?: string
    flagged?: boolean
    flagReason?: string
}

export interface MealSummary {
    totalCalories?: number
    totalProteinG?: number
    totalFatG?: number
    totalCarbsG?: number
    totalFiberG?: number
    foodCount?: number
}

export interface FoodAnalysisResult {
    foods?: FoodNutritionDetail[]
    summary?: MealSummary
    confidence?: number
}

/** POST /api/ai/log — 保存（含用户在 UI 中修改后的）AI 分析结果 */
export interface AiLogSaveRequest {
    title: string
    /** ISO 8601 餐次时间 */
    mealTime: string
    analysisResult: FoodAnalysisResult
}

/** POST /api/food-logs/manual — 纯手动录入，无 AI */
export interface ManualFoodLogRequest {
    title: string
    mealTime: string
    foods: FoodNutritionDetail[]
}

export interface AIResponseDto {
    type?:
        | 'FOOD_ANALYSIS'
        | 'DIET_ADVICE'
        | 'DIET_PLAN'
        | 'DIET_ROAST'
        | 'CHAT'
        | 'PROFILE_NEEDED'
    foodAnalysis?: FoodAnalysisResult
    adviceText?: string
    profileIncomplete?: boolean
    profilePrompt?: string
}

// ---------- Community 模块 ----------
export interface CommentResponse {
    id: number
    postId: number
    userId: string
    authorNickname?: string | null
    authorAvatarUrl?: string | null
    content: string
    createdAt: string
    updatedAt?: string
}

export interface PostResponse {
    id: number
    userId: string
    authorNickname?: string | null
    authorAvatarUrl?: string | null
    title: string
    content: string
    imageUrl?: string | null
    likeCount: number
    createdAt: string
    updatedAt?: string
    comments?: CommentResponse[]
    likedByCurrentUser: boolean
}

export interface CreatePostRequest {
    title: string
    content: string
    imageUrl?: string | null
}

export interface CreateCommentRequest {
    content: string
}

export interface ImpactMetricsResponse {
    totalUsers: number
    totalWeightLost: number
}

// ---------- Water 模块 ----------
export interface WaterLogEntryDto {
    id: string
    amountMl: number
    note?: string | null
    loggedAt: string
}

export interface WaterTodayDto {
    totalMl: number
    totalCups: number
    goalMl: number
    percentAchieved: number
    logs: WaterLogEntryDto[]
}

// ---------- Exercise 模块 ----------
export interface ExerciseEntryDto {
    id: string
    activityType: string
    caloriesBurned: number
    durationMin?: number | null
    note?: string | null
    loggedAt: string
}

export interface ExerciseTodayDto {
    totalCaloriesBurned: number
    totalDurationMin: number
    exercises: ExerciseEntryDto[]
}

// ---------- Challenge 模块 ----------
export interface ChallengeTemplateDto {
    id: string
    title: string
    description?: string | null
    type: string
    durationDays: number
    targetValue: number
    badgeIcon?: string | null
}

export interface NutritionSnapshotDto {
    calories: number
    protein_g: number
    fat_g: number
    carbs_g: number
    fiber_g: number
    water_ml: number
    calories_burned: number
    food_log_count: number
}

export interface ChallengeCheckinDto {
    date: string
    passed: boolean
    actualValue: number
    note?: string | null
    completedDays?: number
    currentStreak?: number
    challengeCompleted?: boolean
    nutritionSnapshot?: NutritionSnapshotDto | null
}

export interface UserChallengeDto {
    id: string
    userId: string
    profileId?: string
    challenge: ChallengeTemplateDto
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | string
    startDate: string
    endDate: string
    completedDays: number
    currentStreak: number
    progressPercent: number
    daysRemaining?: number
    todayCheckedIn?: boolean
    todayPassed?: boolean | null
    joinedAt?: string
    completedAt?: string | null
    checkins?: ChallengeCheckinDto[]
}

export interface TodayStatusDto {
    checkedIn: boolean
    passed?: boolean | null
    currentValue: number
    targetValue: number
    summary: string
    daysRemaining: number
    currentStreak: number
    progressPercent: number
    nutritionSnapshot?: NutritionSnapshotDto | null
}

export type NutritionSnapshot = NutritionSnapshotDto
export type TodayStatusResponse = TodayStatusDto

export interface ChallengeResponse {
    id: string
    title: string
    description: string
    type: string
    durationDays: number
    targetValue: number
    badgeIcon?: string | null
    createdAt?: string
}

export interface CheckinResponse {
    date: string
    passed: boolean
    actualValue: number
    note: string
    completedDays: number
    currentStreak: number
    challengeCompleted: boolean
    message?: string | null
}

export interface UserChallengeResponse {
    id: string
    userId: string
    profileId?: string
    challenge: ChallengeResponse
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | string
    startDate: string
    endDate: string
    completedDays: number
    currentStreak: number
    progressPercent: number
    daysRemaining?: number
    todayCheckedIn?: boolean
    todayPassed?: boolean | null
    joinedAt?: string
    completedAt?: string | null
    checkins?: CheckinResponse[]
}

export interface CreateChallengeRequest {
    title: string
    description: string
    type: string
    duration_days: number
    target_value?: number
    badge_icon?: string
}
