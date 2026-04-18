/**
 * 与后端统一的响应格式及 DTO 类型
 * @see 后端 README 统一响应格式
 */

/** 后端统一响应：{ code, message, data } */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

// ---------- User 模块 ----------
export interface UserProfileDto {
  id: string;
  email?: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  age?: number | null;
  gender?: string | null;
  goal?: string | null;
  dailyCalorieTarget?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BodyDataRequest {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  goal?: string;
  dailyCalorieTarget?: number;
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatarUrl?: string;
}

// ---------- Food 模块 ----------
export interface CreateFoodLogRequest {
  text?: string;
  imageUrl?: string;
  date?: string; // ISO date e.g. 2026-01-01
}

export interface NutritionDataDto {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  [key: string]: number | undefined;
}

export interface FoodLogDto {
  id: string;
  userId: string;
  date: string;
  text?: string | null;
  imageUrl?: string | null;
  recognizedFoods?: string[];
  nutritionData?: NutritionDataDto | null;
  todayCalories?: number;
  todayProtein?: number;
  todayFat?: number;
  todayCarbs?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TodaySummaryDto {
  date: string;
  totalCalories: number;
  totalProtein?: number;
  totalFat?: number;
  totalCarbs?: number;
  logCount?: number;
}

// ---------- AI 模块 ----------
export interface UserNutritionContext {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  goal?: string;
  dailyCalorieTarget?: number;
}

export interface AnalyzeRequest {
  text?: string;
  imageUrl?: string;
  userContext?: UserNutritionContext;
}

export interface FoodAnalysisResult {
  recognizedFoods?: string[];
  nutrition?: NutritionDataDto;
  suggestion?: string;
}

export interface AIResponseDto {
  type?: 'food_log' | 'diet_advice' | 'chat';
  foodAnalysis?: FoodAnalysisResult;
  message?: string;
  [key: string]: unknown;
}

// ---------- Community 模块 ----------
export interface CommentResponse {
  id: number;
  postId: number;
  userId: string;
  authorNickname?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PostResponse {
  id: number;
  userId: string;
  authorNickname?: string | null;
  authorAvatarUrl?: string | null;
  title: string;
  content: string;
  imageUrl?: string | null;
  likeCount: number;
  createdAt: string;
  updatedAt?: string;
  comments?: CommentResponse[];
  likedByCurrentUser: boolean;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  imageUrl?: string | null;
}

export interface CreateCommentRequest {
  content: string;
}

export interface ImpactMetricsResponse {
  totalUsers: number;
  totalWeightLost: number;
}

// ---------- Challenge 模块 ----------
export interface ChallengeResponse {
  id: string;
  title: string;
  description: string;
  type: 'CALORIE_CONTROL' | 'PROTEIN_CHAMPION' | 'LOG_STREAK' | 'LOW_CARB' | 'LIGHT_EATER' | string;
  durationDays: number;
  targetValue: number;
  badgeIcon?: string | null;
  createdAt?: string;
}

export interface CheckinResponse {
  date: string;
  passed: boolean;
  actualValue: number;
  note: string;
  completedDays: number;
  currentStreak: number;
  challengeCompleted: boolean;
  message?: string | null;
}

export interface UserChallengeResponse {
  id: string;
  userId: string;
  challenge: ChallengeResponse;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | string;
  startDate: string;
  endDate: string;
  completedDays: number;
  currentStreak: number;
  progressPercent: number;
  joinedAt: string;
  completedAt?: string | null;
  checkins?: CheckinResponse[];
}
