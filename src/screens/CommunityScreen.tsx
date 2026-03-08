import { StatusBar } from 'expo-status-bar'
import {
    Text,
    View,
    ScrollView,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    TextInput,
} from 'react-native'
import React, { useState, useRef } from 'react'
import { useScreenStyles } from '../theme'

// 类型定义
interface TopParticipant {
    name: string
    avatar: string
    progress: number
}

interface Badge {
    name: string
    image: string
    description: string
    icon: string
    badgeGradient: string
}

interface CommunityChallenge {
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

interface Post {
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

// 5 个预设挑战
const SAMPLE_CHALLENGES: CommunityChallenge[] = [
    {
        id: '1',
        title: 'Daily Check-in',
        description: 'Keep your streak going!',
        duration: 'Ongoing',
        participants: 1250,
        color: '#8BA888',
        joined: true,
        fullDescription: 'Check in daily to maintain your wellness streak. Every day counts towards a healthier lifestyle.',
        icon: '🔥',
        streak: 8,
        badge: {
            name: 'Streak Master',
            image: '🔥',
            description: 'Maintain a 7-day check-in streak',
            icon: '🔥',
            badgeGradient: '#FFF8E7',
        },
        topParticipants: [
            { name: 'Sarah J.', avatar: 'https://via.placeholder.com/32', progress: 45 },
            { name: 'Mike C.', avatar: 'https://via.placeholder.com/32', progress: 38 },
            { name: 'Emma W.', avatar: 'https://via.placeholder.com/32', progress: 32 },
        ],
    },
    {
        id: '2',
        title: 'Zero Sugar Week',
        description: 'Challenge yourself to avoid sugars for 7 days',
        duration: '7 Days',
        participants: 847,
        color: '#F4A261',
        joined: false,
        fullDescription: 'Eliminate added sugars from your diet for 7 consecutive days and feel the difference in your energy levels.',
        icon: '🍫',
        badge: {
            name: 'Sugar Free',
            image: '🍫',
            description: 'Complete a 7-day sugar-free challenge',
            icon: '🍫',
            badgeGradient: '#FFF3E0',
        },
        topParticipants: [
            { name: 'John D.', avatar: 'https://via.placeholder.com/32', progress: 100 },
            { name: 'Lisa M.', avatar: 'https://via.placeholder.com/32', progress: 85 },
            { name: 'Alex K.', avatar: 'https://via.placeholder.com/32', progress: 71 },
        ],
    },
    {
        id: '3',
        title: 'Hydration Week',
        description: 'Drink 8 glasses of water daily for 7 days',
        duration: '7 Days',
        participants: 956,
        color: '#5BA8C4',
        joined: false,
        fullDescription: 'Stay hydrated by drinking 8 glasses of water daily. Track your water intake and transform your health.',
        icon: '💧',
        badge: {
            name: 'Hydration Hero',
            image: '💧',
            description: 'Complete a 7-day hydration challenge',
            icon: '💧',
            badgeGradient: '#E3F2FD',
        },
        topParticipants: [
            { name: 'Tom B.', avatar: 'https://via.placeholder.com/32', progress: 100 },
            { name: 'Nina P.', avatar: 'https://via.placeholder.com/32', progress: 92 },
            { name: 'Chris L.', avatar: 'https://via.placeholder.com/32', progress: 85 },
        ],
    },
    {
        id: '4',
        title: 'Plant-Based Challenge',
        description: '5 days of plant-based eating',
        duration: '5 Days',
        participants: 623,
        color: '#A8C5A0',
        joined: false,
        fullDescription: 'Explore plant-based nutrition by eating only plant-based foods for 5 consecutive days.',
        icon: '🌱',
        badge: {
            name: 'Plant Powered',
            image: '🌱',
            description: 'Complete a 5-day plant-based challenge',
            icon: '🌱',
            badgeGradient: '#F1F8F4',
        },
        topParticipants: [
            { name: 'Rachel G.', avatar: 'https://via.placeholder.com/32', progress: 100 },
            { name: 'David Y.', avatar: 'https://via.placeholder.com/32', progress: 80 },
            { name: 'Sophie T.', avatar: 'https://via.placeholder.com/32', progress: 60 },
        ],
    },
    {
        id: '5',
        title: 'Protein Power Month',
        description: '30 days of meeting your protein goals',
        duration: '30 Days',
        participants: 1089,
        color: '#C47BA0',
        joined: false,
        fullDescription: 'Build muscle and strength by meeting your daily protein targets for 30 consecutive days.',
        icon: '💪',
        badge: {
            name: 'Protein Powerhouse',
            image: '💪',
            description: 'Complete a 30-day protein challenge',
            icon: '💪',
            badgeGradient: '#FCE8F3',
        },
        topParticipants: [
            { name: 'Mark S.', avatar: 'https://via.placeholder.com/32', progress: 100 },
            { name: 'Jason R.', avatar: 'https://via.placeholder.com/32', progress: 90 },
            { name: 'Kyle M.', avatar: 'https://via.placeholder.com/32', progress: 75 },
        ],
    },
]

// 社区 Feed 示例数据
const SAMPLE_POSTS: Post[] = [
    {
        id: '1',
        authorName: 'Sarah Johnson',
        authorImage: 'https://via.placeholder.com/48',
        timestamp: '2 hours ago',
        text: 'Hit my goal for the 5th day in a row! 💪 Grilled salmon and veggies for dinner tonight.',
        image: 'https://via.placeholder.com/400x300',
        likes: 124,
        comments: 8,
        userLiked: false,
    },
    {
        id: '2',
        authorName: 'Mike Chen',
        authorImage: 'https://via.placeholder.com/48',
        timestamp: '4 hours ago',
        text: 'Started my morning with a protein smoothie bowl 🥤 Ready to crush today!',
        image: 'https://via.placeholder.com/400x300',
        likes: 89,
        comments: 5,
        userLiked: false,
    },
    {
        id: '3',
        authorName: 'Emma Wilson',
        authorImage: 'https://via.placeholder.com/48',
        timestamp: '6 hours ago',
        text: 'Day 3 of my hydration challenge! Feeling refreshed and energized 💧',
        image: 'https://via.placeholder.com/400x300',
        likes: 156,
        comments: 12,
        userLiked: false,
    },
]

// 挑战类型常量
const CHALLENGE_TYPES = [
    {
        id: 'nutrition',
        name: 'Nutrition Focus',
        description: 'Dietary goals and eating habits',
        icon: '🥗',
        color: '#C8DCC6',
        gradient: '#8BA888',
    },
    {
        id: 'hydration',
        name: 'Hydration',
        description: 'Water intake and staying hydrated',
        icon: '💧',
        color: '#B8D8E5',
        gradient: '#5BA8C4',
    },
    {
        id: 'restriction',
        name: 'Food Restriction',
        description: 'Eliminate specific foods',
        icon: '🍬',
        color: '#F8E5D3',
        gradient: '#F4A261',
    },
    {
        id: 'fitness',
        name: 'Fitness & Exercise',
        description: 'Physical activity goals',
        icon: '💪',
        color: '#E8C4D8',
        gradient: '#C47BA0',
    },
    {
        id: 'habit',
        name: 'Healthy Habits',
        description: 'Build lasting wellness habits',
        icon: '✨',
        color: '#A8C5A0',
        gradient: '#8BA888',
    },
]

// 时长选项
const DURATION_OPTIONS = [
    { label: '3 Days', value: '3', description: 'Quick start challenge' },
    { label: '5 Days', value: '5', description: 'Weekday commitment' },
    { label: '7 Days', value: '7', description: 'One full week' },
    { label: '14 Days', value: '14', description: 'Two week challenge' },
    { label: '21 Days', value: '21', description: 'Habit forming period' },
    { label: '30 Days', value: '30', description: 'Monthly commitment' },
]

// 徽章设计
const BADGE_DESIGNS = [
    { icon: '🏆', gradient: '#F4A261', name: 'Champion' },
    { icon: '🏅', gradient: '#8BA888', name: 'Achiever' },
    { icon: '🔥', gradient: '#E76F51', name: 'On Fire' },
    { icon: '⭐', gradient: '#5BA8C4', name: 'Star' },
    { icon: '❤️', gradient: '#C47BA0', name: 'Wellness' },
    { icon: '🎯', gradient: '#E9967A', name: 'Bullseye' },
    { icon: '🌿', gradient: '#8BA888', name: 'Nature' },
    { icon: '📈', gradient: '#5BA8C4', name: 'Growth' },
    { icon: '⚡', gradient: '#F4A261', name: 'Energy' },
]

export function CommunityScreen() {
    const styles = useScreenStyles()
    const flatListRef = useRef<FlatList>(null)
    const [challenges, setChallenges] = useState(SAMPLE_CHALLENGES)
    const [posts, setPosts] = useState(SAMPLE_POSTS)
    const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null)
    const [showChallengeDetail, setShowChallengeDetail] = useState(false)
    const [showCreateChallenge, setShowCreateChallenge] = useState(false)
    const [showCreatePost, setShowCreatePost] = useState(false)
    const [isPremium] = useState(true) // 模拟 Premium 用户
    const [scrollOffset, setScrollOffset] = useState(0) // 跟踪 FlatList 滚动位置
    
    // Challenge 创建表单状态
    const [createStep, setCreateStep] = useState(1)
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        duration: '',
        badge: 0,
        color: '',
        gradient: '',
        selectedTypeData: null as any,
    })
    const [titleError, setTitleError] = useState('')
    const [descError, setDescError] = useState('')

    // 左右滚动函数 - 使用累积偏移量确保滚动正确
    const scroll = (direction: 'left' | 'right') => {
        if (flatListRef.current) {
            const scrollAmount = 300 // 每次滚动 300px
            const newOffset = direction === 'left' ? 
                Math.max(0, scrollOffset - scrollAmount) : 
                scrollOffset + scrollAmount
            
            flatListRef.current.scrollToOffset({
                offset: newOffset,
                animated: true,
            })
            setScrollOffset(newOffset)
        }
    }

    // 处理滚动事件以更新当前位置
    const handleScroll = (event: any) => {
        const newOffset = event.nativeEvent.contentOffset.x
        setScrollOffset(newOffset)
    }

    // Challenge 创建函数
    const handleTypeSelect = (type: typeof CHALLENGE_TYPES[0]) => {
        setFormData({
            ...formData,
            type: type.id,
            color: type.color,
            gradient: type.gradient,
            selectedTypeData: type,
        })
        setCreateStep(2)
    }

    const handleTitleChange = (value: string) => {
        if (value.length > 50) {
            setTitleError('Title must be 50 characters or less')
            return
        }
        setTitleError('')
        setFormData({ ...formData, title: value })
    }

    const handleDescChange = (value: string) => {
        if (value.length > 120) {
            setDescError('Description must be 120 characters or less')
            return
        }
        setDescError('')
        setFormData({ ...formData, description: value })
    }

    const resetChallengeForm = () => {
        setCreateStep(1)
        setFormData({
            type: '',
            title: '',
            description: '',
            duration: '',
            badge: 0,
            color: '',
            gradient: '',
            selectedTypeData: null,
        })
        setTitleError('')
        setDescError('')
    }

    const handleCreateChallenge = () => {
        if (!formData.title || !formData.description || !formData.duration) {
            return
        }

        const selectedBadge = BADGE_DESIGNS[formData.badge]
        const selectedType = formData.selectedTypeData

        const newChallenge: CommunityChallenge = {
            id: Date.now().toString(),
            title: formData.title,
            description: formData.description,
            icon: selectedType?.icon || '🏆',
            duration: `${formData.duration} Days`,
            participants: 0,
            color: formData.color,
            joined: true,
            fullDescription: formData.description,
            badge: {
                name: `${formData.title} ${selectedBadge.name}`,
                image: '',
                description: `Complete the ${formData.title} challenge to earn this badge!`,
                icon: selectedBadge.icon,
                badgeGradient: selectedBadge.gradient,
            },
            topParticipants: [],
        }

        setChallenges([...challenges, newChallenge])
        setShowCreateChallenge(false)
        resetChallengeForm()
    }

    const handleLikePost = (postId: string) => {
        setPosts(
            posts.map((post) =>
                post.id === postId
                    ? {
                        ...post,
                        userLiked: !post.userLiked,
                        likes: post.userLiked ? post.likes - 1 : post.likes + 1,
                    }
                    : post
            )
        )
    }

    const handleJoinChallenge = (challengeId: string) => {
        setChallenges(
            challenges.map((challenge) =>
                challenge.id === challengeId ? { ...challenge, joined: !challenge.joined } : challenge
            )
        )
        setShowChallengeDetail(false)
    }

    const handleCreatePost = (newPostData: { text: string; image: string }) => {
        const newPost: Post = {
            id: Date.now().toString(),
            authorName: 'You',
            authorImage: 'https://via.placeholder.com/48',
            timestamp: 'Just now',
            text: newPostData.text,
            image: newPostData.image,
            likes: 0,
            comments: 0,
            userLiked: false,
        }
        setPosts([newPost, ...posts])
        setShowCreatePost(false)
    }

    const ChallengeCard = ({ challenge }: { challenge: CommunityChallenge }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedChallenge(challenge)
                setShowChallengeDetail(true)
            }}
            style={[localStyles.challengeCard, { backgroundColor: challenge.color }]}
        >
            <View style={localStyles.challengeHeader}>
                <Text style={localStyles.challengeIcon}>{challenge.icon}</Text>
                <View style={localStyles.challengeInfo}>
                    <Text style={localStyles.challengeTitle}>{challenge.title}</Text>
                    <Text style={localStyles.challengeStatus}>{challenge.duration}</Text>
                    {challenge.streak && <Text style={localStyles.streakText}>🔥 {challenge.streak} day streak</Text>}
                </View>
            </View>
            <Text style={localStyles.challengeDescription}>{challenge.description}</Text>
            <View style={localStyles.challengeFooter}>
                <Text style={localStyles.participantsText}>{challenge.participants} participants</Text>
                <TouchableOpacity
                    onPress={(e: any) => {
                        e.stopPropagation()
                        handleJoinChallenge(challenge.id)
                        setSelectedChallenge(challenge)
                        setShowChallengeDetail(true)
                    }}
                    style={[
                        localStyles.joinButton,
                        challenge.joined && localStyles.joinedButtonStyle,
                    ]}
                >
                    <Text style={localStyles.joinButtonText}>{challenge.joined ? '✓ Joined' : 'Join'}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    )

    const PostCard = ({ post }: { post: Post }) => (
        <View style={localStyles.postCard}>
            <View style={localStyles.postHeader}>
                <Image source={{ uri: post.authorImage }} style={localStyles.authorAvatar} />
                <View style={localStyles.postMeta}>
                    <Text style={localStyles.authorName}>{post.authorName}</Text>
                    <Text style={localStyles.timestamp}>{post.timestamp}</Text>
                </View>
            </View>

            <Text style={localStyles.postText}>{post.text}</Text>

            <Image source={{ uri: post.image }} style={localStyles.postImage} />

            <View style={localStyles.postFooter}>
                <View style={localStyles.engagementStats}>
                    <TouchableOpacity
                        style={localStyles.statItem}
                        onPress={() => handleLikePost(post.id)}
                    >
                        <Text style={localStyles.heartIcon}>{post.userLiked ? '❤️' : '🤍'}</Text>
                        <Text style={localStyles.statNumber}>{post.likes}</Text>
                    </TouchableOpacity>
                    <View style={localStyles.statItem}>
                        <Text style={localStyles.commentIcon}>💬</Text>
                        <Text style={localStyles.statNumber}>{post.comments}</Text>
                    </View>
                </View>
            </View>
        </View>
    )

    return (
        <ScrollView style={localStyles.container} showsVerticalScrollIndicator={false}>
            <View style={localStyles.header}>
                <Text style={localStyles.title}>FoodPrint</Text>
            </View>

            {/* Community Challenges Section */}
            <View style={localStyles.section}>
                <View style={localStyles.sectionHeader}>
                    <Text style={localStyles.sectionTitle}>Community Challenges</Text>
                    <View style={localStyles.buttonGroup}>
                        {isPremium && (
                            <TouchableOpacity
                                style={localStyles.addButton}
                                onPress={() => setShowCreateChallenge(true)}
                            >
                                <Text style={localStyles.addButtonText}>+</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={localStyles.scrollButton}
                            onPress={() => scroll('left')}
                        >
                            <Text style={localStyles.scrollButtonText}>‹</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={localStyles.scrollButton}
                            onPress={() => scroll('right')}
                        >
                            <Text style={localStyles.scrollButtonText}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <FlatList
                    ref={flatListRef}
                    data={challenges}
                    renderItem={({ item }) => <ChallengeCard challenge={item} />}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    contentContainerStyle={localStyles.challengeListContent}
                    onScroll={handleScroll}
                    scrollEnabled={true}
                />
            </View>

            {/* Community Feed Section */}
            <View style={localStyles.section}>
                <View style={localStyles.sectionHeader}>
                    <Text style={localStyles.sectionTitle}>Community Feed</Text>
                    <TouchableOpacity
                        style={localStyles.postButton}
                        onPress={() => setShowCreatePost(true)}
                    >
                        <Text style={localStyles.postButtonIcon}>✎</Text>
                        <Text style={localStyles.postButtonText}>Share</Text>
                    </TouchableOpacity>
                </View>
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </View>

            {/* Challenge Detail Modal */}
            {selectedChallenge && (
                <Modal
                    visible={showChallengeDetail}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setShowChallengeDetail(false)}
                >
                    <ScrollView style={[localStyles.container, { paddingTop: 0 }]}>
                        <View
                            style={[
                                localStyles.challengeHeaderCard,
                                { backgroundColor: selectedChallenge.color },
                            ]}
                        >
                            <View style={localStyles.headerContent}>
                                <Text style={localStyles.headerIcon}>{selectedChallenge.icon}</Text>
                                <View style={localStyles.headerInfo}>
                                    <Text style={localStyles.headerTitle}>{selectedChallenge.title}</Text>
                                    <View style={localStyles.headerMeta}>
                                        <Text style={localStyles.headerMetaText}>📅 {selectedChallenge.duration}</Text>
                                        <Text style={localStyles.headerMetaText}>👥 {selectedChallenge.participants}</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={localStyles.closeButtonTop}
                                onPress={() => setShowChallengeDetail(false)}
                            >
                                <Text style={localStyles.closeButtonIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={localStyles.detailSection}>
                            <Text style={localStyles.detailSectionTitle}>About This Challenge</Text>
                            <Text style={localStyles.aboutDescription}>{selectedChallenge.fullDescription}</Text>
                        </View>

                        <View style={localStyles.detailSection}>
                            <Text style={localStyles.detailSectionTitle}>Reward Badge</Text>
                            <View
                                style={[
                                    localStyles.badgeCard,
                                    { backgroundColor: selectedChallenge.badge.badgeGradient },
                                ]}
                            >
                                <Text style={localStyles.badgeIcon}>{selectedChallenge.badge.icon}</Text>
                                <Text style={localStyles.badgeName}>{selectedChallenge.badge.name}</Text>
                                <Text style={localStyles.badgeDescription}>{selectedChallenge.badge.description}</Text>
                            </View>
                        </View>

                        <View style={localStyles.detailSection}>
                            <Text style={localStyles.detailSectionTitle}>Top Participants</Text>
                            {selectedChallenge.topParticipants.map((participant, index) => (
                                <View key={index} style={localStyles.participantItem}>
                                    <Image
                                        source={{ uri: participant.avatar }}
                                        style={localStyles.participantAvatar}
                                    />
                                    <View style={localStyles.participantInfo}>
                                        <Text style={localStyles.participantName}>{participant.name}</Text>
                                        <View style={localStyles.progressBar}>
                                            <View
                                                style={[
                                                    localStyles.progressFill,
                                                    { width: `${participant.progress}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                    <Text style={localStyles.progressText}>{participant.progress}%</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[
                                localStyles.joinChallengeButton,
                                selectedChallenge.joined && localStyles.joinedButton,
                            ]}
                            onPress={() => handleJoinChallenge(selectedChallenge.id)}
                        >
                            <Text style={localStyles.joinChallengeButtonText}>
                                {selectedChallenge.joined ? '✓ Joined Challenge' : 'Join Challenge'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Modal>
            )}

            {/* Create Challenge Modal (Premium Only) - 4步向导 */}
            {isPremium && (
                <Modal
                    visible={showCreateChallenge}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => {
                        setShowCreateChallenge(false)
                        resetChallengeForm()
                    }}
                >
                    <ScrollView style={localStyles.container} showsVerticalScrollIndicator={false}>
                        {/* Header - 橙色渐变 */}
                        <View style={localStyles.challengeModalHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCreateChallenge(false)
                                    resetChallengeForm()
                                }}
                            >
                                <Text style={localStyles.challengeModalCloseText}>✕</Text>
                            </TouchableOpacity>
                            <View style={localStyles.challengeModalTitleContainer}>
                                <Text style={localStyles.challengeModalIcon}>✨</Text>
                                <View>
                                    <Text style={localStyles.challengeModalTitle}>Create Challenge</Text>
                                    <Text style={localStyles.challengeModalSubtitle}>Premium Feature</Text>
                                </View>
                            </View>
                        </View>

                        {/* 进度条 */}
                        <View style={localStyles.progressBarContainer}>
                            {[1, 2, 3, 4].map((step) => (
                                <View
                                    key={step}
                                    style={[
                                        localStyles.progressBarSegment,
                                        step <= createStep && localStyles.progressBarSegmentActive,
                                    ]}
                                />
                            ))}
                        </View>

                        <View style={localStyles.createChallengeContent}>
                            {/* ========== Step 1: 选择挑战类型 ========== */}
                            {createStep === 1 && (
                                <View style={localStyles.stepContainer}>
                                    <Text style={localStyles.stepTitle}>Choose Challenge Type</Text>
                                    <Text style={localStyles.stepSubtitle}>Select the category that best fits your goal</Text>
                                    
                                    <View style={localStyles.typeCardsContainer}>
                                        {CHALLENGE_TYPES.map((type) => (
                                            <TouchableOpacity
                                                key={type.id}
                                                onPress={() => handleTypeSelect(type)}
                                                style={localStyles.typeCard}
                                            >
                                                <View
                                                    style={[
                                                        localStyles.typeCardIcon,
                                                        { backgroundColor: type.color },
                                                    ]}
                                                >
                                                    <Text style={localStyles.typeCardIconText}>
                                                        {type.icon}
                                                    </Text>
                                                </View>
                                                <View style={localStyles.typeCardContent}>
                                                    <Text style={localStyles.typeCardName}>{type.name}</Text>
                                                    <Text style={localStyles.typeCardDesc}>
                                                        {type.description}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* ========== Step 2: 填写详情 ========== */}
                            {createStep === 2 && (
                                <View style={localStyles.stepContainer}>
                                    <TouchableOpacity
                                        onPress={() => setCreateStep(1)}
                                        style={localStyles.backButton}
                                    >
                                        <Text style={localStyles.backButtonText}>← Back to types</Text>
                                    </TouchableOpacity>

                                    <Text style={localStyles.stepTitle}>Challenge Details</Text>
                                    <Text style={localStyles.stepSubtitle}>Give your challenge a catchy name</Text>

                                    {/* 标题输入 */}
                                    <View style={localStyles.formGroup}>
                                        <Text style={localStyles.formLabelChallenge}>
                                            Challenge Title <Text style={localStyles.requiredMark}>*</Text>
                                        </Text>
                                        <TextInput
                                            value={formData.title}
                                            onChangeText={handleTitleChange}
                                            placeholder="e.g., Green Smoothie Week"
                                            placeholderTextColor="#999"
                                            maxLength={50}
                                            style={localStyles.textInputField}
                                        />
                                        <View style={localStyles.formHint}>
                                            {titleError ? (
                                                <Text style={localStyles.errorText}>{titleError}</Text>
                                            ) : (
                                                <Text style={localStyles.hintText}>Make it clear and motivating</Text>
                                            )}
                                            <Text style={localStyles.charCountChallenge}>
                                                {formData.title.length}/50
                                            </Text>
                                        </View>
                                    </View>

                                    {/* 描述输入 */}
                                    <View style={localStyles.formGroup}>
                                        <Text style={localStyles.formLabelChallenge}>
                                            Description <Text style={localStyles.requiredMark}>*</Text>
                                        </Text>
                                        <TextInput
                                            value={formData.description}
                                            onChangeText={handleDescChange}
                                            placeholder="Describe what participants need to do..."
                                            placeholderTextColor="#999"
                                            maxLength={120}
                                            multiline
                                            numberOfLines={3}
                                            style={[localStyles.textInputField, { height: 80 }]}
                                        />
                                        <View style={localStyles.formHint}>
                                            {descError ? (
                                                <Text style={localStyles.errorText}>{descError}</Text>
                                            ) : (
                                                <Text style={localStyles.hintText}>Keep it concise and clear</Text>
                                            )}
                                            <Text style={localStyles.charCountChallenge}>
                                                {formData.description.length}/120
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setCreateStep(3)}
                                        disabled={!formData.title || !formData.description || !!titleError || !!descError}
                                        style={[
                                            localStyles.continueButton,
                                            (!formData.title || !formData.description) && localStyles.continueButtonDisabled,
                                        ]}
                                    >
                                        <Text style={localStyles.continueButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* ========== Step 3: 选择时长 ========== */}
                            {createStep === 3 && (
                                <View style={localStyles.stepContainer}>
                                    <TouchableOpacity
                                        onPress={() => setCreateStep(2)}
                                        style={localStyles.backButton}
                                    >
                                        <Text style={localStyles.backButtonText}>← Back</Text>
                                    </TouchableOpacity>

                                    <Text style={localStyles.stepTitle}>Challenge Duration</Text>
                                    <Text style={localStyles.stepSubtitle}>How long will this challenge last?</Text>

                                    <View style={localStyles.durationGrid}>
                                        {DURATION_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                onPress={() => setFormData({ ...formData, duration: option.value })}
                                                style={[
                                                    localStyles.durationCard,
                                                    formData.duration === option.value &&
                                                        localStyles.durationCardSelected,
                                                ]}
                                            >
                                                <Text style={localStyles.durationLabel}>{option.label}</Text>
                                                <Text style={localStyles.durationDesc}>{option.description}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setCreateStep(4)}
                                        disabled={!formData.duration}
                                        style={[
                                            localStyles.continueButton,
                                            !formData.duration && localStyles.continueButtonDisabled,
                                        ]}
                                    >
                                        <Text style={localStyles.continueButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* ========== Step 4: 选择徽章 + 预览 ========== */}
                            {createStep === 4 && (
                                <View style={localStyles.stepContainer}>
                                    <TouchableOpacity
                                        onPress={() => setCreateStep(3)}
                                        style={localStyles.backButton}
                                    >
                                        <Text style={localStyles.backButtonText}>← Back</Text>
                                    </TouchableOpacity>

                                    <Text style={localStyles.stepTitle}>Reward Badge</Text>
                                    <Text style={localStyles.stepSubtitle}>
                                        Choose a badge design for participants
                                    </Text>

                                    {/* 徽章网格 */}
                                    <View style={localStyles.badgeGrid}>
                                        {BADGE_DESIGNS.map((badge, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => setFormData({ ...formData, badge: index })}
                                                style={[
                                                    localStyles.badgeOption,
                                                    formData.badge === index &&
                                                        localStyles.badgeOptionSelected,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        localStyles.badgeCircle,
                                                        { backgroundColor: badge.gradient },
                                                    ]}
                                                >
                                                    <Text style={localStyles.badgeEmoji}>{badge.icon}</Text>
                                                </View>
                                                <Text style={localStyles.badgeNameChallenge}>{badge.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 预览卡片 */}
                                    <View style={localStyles.previewContainer}>
                                        <Text style={localStyles.previewTitle}>🏆 Preview</Text>
                                        <View
                                            style={[
                                                localStyles.previewCard,
                                                { backgroundColor: formData.color },
                                            ]}
                                        >
                                            <View style={localStyles.previewHeader}>
                                                <Text style={localStyles.previewIcon}>
                                                    {formData.selectedTypeData?.icon}
                                                </Text>
                                                <View>
                                                    <Text style={localStyles.previewTitle2}>
                                                        {formData.title || 'Your Challenge'}
                                                    </Text>
                                                    <Text style={localStyles.previewDuration}>
                                                        {formData.duration} Days
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={localStyles.previewDesc}>
                                                {formData.description || 'Your description here...'}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleCreateChallenge}
                                        style={localStyles.createChallengeButton}
                                    >
                                        <Text style={localStyles.createChallengeButtonText}>Create Challenge</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </Modal>
            )}

            {/* Create Post Modal */}
            <CreatePostModal 
                visible={showCreatePost}
                onClose={() => setShowCreatePost(false)}
                onCreate={handleCreatePost}
            />

            <StatusBar style="auto" />
        </ScrollView>
    )
}

interface CreatePostModalProps {
    visible: boolean
    onClose: () => void
    onCreate: (postData: { text: string; image: string }) => void
}

const EMOJI_CATEGORIES = ['💪', '🥗', '🔥', '✨', '🎯', '💚', '🥑', '🍎', '⭐']

const CreatePostModal = ({ visible, onClose, onCreate }: CreatePostModalProps) => {
    const [postText, setPostText] = useState('')
    const [selectedImage, setSelectedImage] = useState('')
    const [showImagePicker, setShowImagePicker] = useState(false)

    const mealCategories = [
        { emoji: '🥗', label: 'Salad' },
        { emoji: '🐟', label: 'Salmon' },
        { emoji: '🥤', label: 'Smoothie' },
        { emoji: '🥑', label: 'Toast' },
        { emoji: '🍚', label: 'Rice Bowl' },
        { emoji: '🍓', label: 'Fruits' },
        { emoji: '🍱', label: 'Meal Prep' },
        { emoji: '🍝', label: 'Pasta' },
    ]

    const handlePost = () => {
        if (postText.trim()) {
            onCreate({
                text: postText,
                image: selectedImage,
            })
            setPostText('')
            setSelectedImage('')
            setShowImagePicker(false)
        }
    }

    const handleEmojiInsert = (emoji: string) => {
        setPostText(postText + emoji)
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={[localStyles.container, { paddingTop: 0 }]}>
                {/* Header */}
                <View style={localStyles.createPostHeader}>
                    <Text style={localStyles.createPostTitle}>Create Post</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={localStyles.closeCreatePostButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={localStyles.createPostContent}>
                    {/* Text Input */}
                    <TextInput
                        style={localStyles.createPostInputField}
                        placeholder="What's on your plate today? Share your meal, achievement, or health tip... 💪"
                        placeholderTextColor="#999"
                        multiline
                        value={postText}
                        onChangeText={setPostText}
                        maxLength={500}
                    />
                    <Text style={localStyles.charCounterText}>
                        {postText.length}/500
                    </Text>

                    {/* Selected Image Preview */}
                    {selectedImage && (
                        <View style={localStyles.imagePreviewSection}>
                            <Image source={{ uri: selectedImage }} style={localStyles.previewImage} />
                            <TouchableOpacity
                                style={localStyles.deleteImageButton}
                                onPress={() => setSelectedImage('')}
                            >
                                <Text style={localStyles.deleteImageButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Image Picker Button */}
                    {!selectedImage && (
                        <TouchableOpacity
                            style={localStyles.imagePickerButtonContainer}
                            onPress={() => setShowImagePicker(!showImagePicker)}
                        >
                            <Text style={localStyles.imagePickerButtonText}>📷 Add a photo to your post</Text>
                        </TouchableOpacity>
                    )}

                    {/* Meal Categories Grid */}
                    {showImagePicker && !selectedImage && (
                        <View>
                            <Text style={localStyles.mealCategoryTitle}>Choose a meal photo</Text>
                            <View style={localStyles.mealGrid}>
                                {mealCategories.map((meal, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={localStyles.mealOption}
                                        onPress={() => {
                                            setSelectedImage(`https://via.placeholder.com/300?text=${meal.label}`)
                                            setShowImagePicker(false)
                                        }}
                                    >
                                        <Text style={localStyles.mealEmoji}>{meal.emoji}</Text>
                                        <Text style={localStyles.mealLabel}>{meal.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Quick Emojis */}
                    <View style={localStyles.emojiContainer}>
                        {EMOJI_CATEGORIES.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={localStyles.emojiButton}
                                onPress={() => handleEmojiInsert(emoji)}
                            >
                                <Text style={localStyles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={localStyles.createPostActionsContainer}>
                        <TouchableOpacity
                            style={localStyles.cancelButtonStyle}
                            onPress={onClose}
                        >
                            <Text style={localStyles.cancelButtonTextStyle}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                localStyles.postCreateButton,
                                !postText.trim() && localStyles.postCreateButtonDisabled,
                            ]}
                            disabled={!postText.trim()}
                            onPress={handlePost}
                        >
                            <Text style={localStyles.postCreateButtonText}>Post ✓</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    )
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8F5',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F4A261',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    addButtonText: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: 'bold',
    },
    scrollButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    scrollButtonText: {
        fontSize: 20,
        color: '#666',
        fontWeight: '600',
    },
    challengeListContent: {
        paddingHorizontal: 8,
    },
    // Challenge Card styles
    challengeCard: {
        marginHorizontal: 8,
        marginBottom: 12,
        borderRadius: 20,
        padding: 16,
        width: 280,
        justifyContent: 'space-between',
    },
    challengeHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    challengeIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    challengeInfo: {
        flex: 1,
    },
    challengeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    challengeStatus: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    streakText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
        marginTop: 4,
    },
    challengeDescription: {
        fontSize: 14,
        color: '#FFF',
        marginBottom: 12,
        lineHeight: 20,
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    participantsText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    joinButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    joinedButtonStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    joinButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    // Challenge Detail Modal styles
    challengeHeaderCard: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 16,
    },
    headerIcon: {
        fontSize: 68,
        marginRight: 16,
        marginBottom: 8,
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 10,
    },
    headerMeta: {
        flexDirection: 'column',
        gap: 6,
    },
    headerMetaText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '500',
    },
    closeButtonTop: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonIcon: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: '700',
    },
    modalHeader: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        fontSize: 16,
        color: '#8BA888',
        fontWeight: '700',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
    },
    detailSection: {
        paddingHorizontal: 16,
        marginBottom: 28,
        marginTop: 4,
    },
    detailSectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 14,
    },
    aboutDescription: {
        fontSize: 16,
        color: '#555',
        lineHeight: 26,
        fontWeight: '400',
    },
    badgeCard: {
        borderRadius: 18,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    badgeIcon: {
        fontSize: 72,
        marginBottom: 18,
    },
    badgeName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2D2D2D',
        marginBottom: 10,
        textAlign: 'center',
    },
    badgeDescription: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '400',
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    participantAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 14,
        borderWidth: 2,
        borderColor: '#8BA888',
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E8E8E8',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#8BA888',
    },
    progressText: {
        fontSize: 13,
        color: '#8BA888',
        fontWeight: '700',
        marginLeft: 12,
        minWidth: 40,
        textAlign: 'right',
    },
    joinChallengeButton: {
        marginHorizontal: 16,
        marginBottom: 32,
        marginTop: 32,
        paddingVertical: 16,
        backgroundColor: '#8BA888',
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#8BA888',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    joinedButton: {
        backgroundColor: 'rgba(139, 168, 136, 0.6)',
    },
    joinChallengeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    // Post Card styles
    postCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    authorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    postMeta: {
        flex: 1,
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    timestamp: {
        fontSize: 13,
        color: '#999',
    },
    postText: {
        fontSize: 15,
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 12,
        lineHeight: 22,
    },
    postImage: {
        width: '100%',
        height: 240,
        backgroundColor: '#EEE',
    },
    postFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    engagementStats: {
        flexDirection: 'row',
        gap: 24,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    heartIcon: {
        fontSize: 18,
    },
    commentIcon: {
        fontSize: 18,
    },
    statNumber: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    // Create Challenge Form styles
    createForm: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 16,
    },
    durationOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    durationOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#8BA888',
        borderRadius: 20,
        width: '32%',
        alignItems: 'center',
    },
    durationText: {
        fontSize: 14,
        color: '#8BA888',
        fontWeight: '500',
    },
    createButton: {
        paddingVertical: 14,
        backgroundColor: '#8BA888',
        borderRadius: 12,
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    // Post Button styles
    postButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#8BA888',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    postButtonIcon: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '700',
    },
    postButtonText: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    // Create Post Modal styles
    createPostHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#A8C5A0',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    createPostTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    createPostContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: '#FFF',
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    postTextInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 8,
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginBottom: 16,
    },
    foodCategorySection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    foodCategoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    foodCategoryButton: {
        width: '30%',
        aspectRatio: 1,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F8F5',
    },
    foodCategoryActive: {
        borderColor: '#8BA888',
        backgroundColor: '#E8F0E7',
    },
    foodEmoji: {
        fontSize: 32,
    },
    imagePreviewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E8F0E7',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    selectedImageText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    removeImageButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFF',
        borderRadius: 8,
    },
    removeImageText: {
        fontSize: 14,
        color: '#E76F51',
        fontWeight: '500',
    },
    quickEmojiSection: {
        marginBottom: 16,
    },
    emojiBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickEmoji: {
        padding: 8,
        backgroundColor: '#F5F8F5',
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    createPostFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#F5F8F5',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    postSubmitButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#8BA888',
        borderRadius: 12,
        alignItems: 'center',
    },
    postSubmitButtonDisabled: {
        backgroundColor: '#CCC',
    },
    postSubmitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    // Additional Create Post Modal styles
    createPostHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#8BA888',
    },
    closeCreatePostButton: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: 'bold',
    },
    createPostInputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    createPostInputField: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 16,
        padding: 12,
        fontSize: 16,
        minHeight: 120,
        backgroundColor: '#FFF',
        color: '#333',
    },
    charCounterText: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        textAlign: 'right',
    },
    imagePickerButtonContainer: {
        borderWidth: 2,
        borderColor: '#8BA888',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 16,
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8BA888',
    },
    mealCategoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 12,
    },
    mealGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    mealOption: {
        width: 160,
        backgroundColor: '#A8C5A0',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    mealLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        textAlign: 'center',
    },
    emojiContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
        marginBottom: 16,
    },
    emojiButton: {
        width: 56,
        height: 56,
        backgroundColor: '#F5F8F5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiText: {
        fontSize: 20,
    },
    createPostActionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    cancelButtonStyle: {
        flex: 1,
        backgroundColor: '#E8E8E8',
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonTextStyle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    postCreateButton: {
        flex: 1,
        backgroundColor: '#8BA888',
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    postCreateButtonDisabled: {
        backgroundColor: '#CCC',
        opacity: 0.6,
    },
    postCreateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    // Image Preview styles for CreatePostModal
    imagePreviewSection: {
        position: 'relative',
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 200,
    },
    deleteImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteImageButtonText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
    },
    // ========== 4步向导 Challenge 创建样式 ==========
    challengeModalHeader: {
        backgroundColor: '#F4A261',
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingLeft: 16,
        position: 'relative',
    },
    challengeModalCloseText: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: '700',
        marginBottom: 12,
    },
    challengeModalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    challengeModalIcon: {
        fontSize: 40,
    },
    challengeModalTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFF',
    },
    challengeModalSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 4,
    },
    // 进度条
    progressBarContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    progressBarSegment: {
        flex: 1,
        height: 4,
        backgroundColor: '#E8E8E8',
        borderRadius: 2,
    },
    progressBarSegmentActive: {
        backgroundColor: '#8BA888',
    },
    createChallengeContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 40,
    },
    stepContainer: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        fontSize: 15,
        color: '#8BA888',
        fontWeight: '600',
    },
    // Step 1: 类型选择
    typeCardsContainer: {
        gap: 12,
    },
    typeCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        alignItems: 'flex-start',
        gap: 14,
    },
    typeCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    typeCardIconText: {
        fontSize: 28,
    },
    typeCardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    typeCardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    typeCardDesc: {
        fontSize: 13,
        color: '#666',
    },
    // Step 2: 表单
    formGroup: {
        marginBottom: 20,
    },
    formLabelChallenge: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    requiredMark: {
        color: '#E74C3C',
    },
    textInputField: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#FAFAFA',
    },
    formHint: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    hintText: {
        fontSize: 13,
        color: '#999',
    },
    errorText: {
        fontSize: 13,
        color: '#E74C3C',
    },
    charCountChallenge: {
        fontSize: 13,
        color: '#999',
    },
    // Step 3: 时长选择
    durationGrid: {
        marginBottom: 24,
    },
    durationCard: {
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        backgroundColor: '#FFF',
    },
    durationCardSelected: {
        borderColor: '#8BA888',
        backgroundColor: '#F5F8F5',
    },
    durationLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    durationDesc: {
        fontSize: 13,
        color: '#666',
    },
    // Step 4: 徽章选择
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    badgeOption: {
        width: '32%',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    badgeOptionSelected: {
        borderColor: '#8BA888',
        backgroundColor: '#F5F8F5',
    },
    badgeCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    badgeEmoji: {
        fontSize: 24,
    },
    badgeNameChallenge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
    },
    // 预览卡片
    previewContainer: {
        marginBottom: 24,
        backgroundColor: '#FEF3E2',
        borderRadius: 14,
        padding: 14,
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewCard: {
        borderRadius: 14,
        padding: 16,
        paddingBottom: 14,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
    },
    previewIcon: {
        fontSize: 36,
    },
    previewTitle2: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 2,
    },
    previewDuration: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    previewDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
    // 按钮样式
    continueButton: {
        backgroundColor: '#8BA888',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#8BA888',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    continueButtonDisabled: {
        backgroundColor: '#CCC',
        shadowOpacity: 0.05,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    createChallengeButton: {
        backgroundColor: '#F4A261',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#F4A261',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    createChallengeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
})

