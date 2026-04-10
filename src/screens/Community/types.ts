// Community 相关类型定义

export interface TopParticipant {
    name: string
    avatar: string
    progress: number
}

export interface Badge {
    name: string
    image: string
    description: string
    icon: string
    badgeGradient: string
}

export interface CommunityChallenge {
    id: string
    title: string
    description: string
    duration: string
    participants: number
    color: string
    joined: boolean
    fullDescription: string
    badge: Badge
    topParticipants: TopParticipant[]
    icon: string
    streak?: number
}

export interface Post {
    id: string
    authorName: string
    authorImage: string
    timestamp: string
    text: string
    image: string
    likes: number
    comments: number
    userLiked?: boolean
}

export interface CreateChallengeFormData {
    type: string
    title: string
    description: string
    duration: string
    badge: number
    color: string
    gradient: string
    selectedTypeData: any
}

export interface ChallengeType {
    id: string
    name: string
    description: string
    icon: string
    color: string
    gradient: string
}

export interface DurationOption {
    label: string
    value: string
    description: string
}

export interface BadgeDesign {
    icon: string
    gradient: string
    name: string
}
