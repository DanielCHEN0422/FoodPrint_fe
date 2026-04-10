import { useState, useRef } from 'react'
import { FlatList } from 'react-native'
import { CommunityChallenge, Post, CreateChallengeFormData } from '../types'
import { SAMPLE_CHALLENGES, SAMPLE_POSTS, BADGE_DESIGNS } from '../constants'

export const useCommunityState = () => {
    const flatListRef = useRef<FlatList>(null)
    
    // Challenge 相关状态
    const [challenges, setChallenges] = useState<CommunityChallenge[]>(SAMPLE_CHALLENGES)
    const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null)
    const [showChallengeDetail, setShowChallengeDetail] = useState(false)
    const [showCreateChallenge, setShowCreateChallenge] = useState(false)
    const [scrollOffset, setScrollOffset] = useState(0)
    
    // Post 相关状态
    const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS)
    const [showCreatePost, setShowCreatePost] = useState(false)
    
    // Challenge 创建表单状态
    const [createStep, setCreateStep] = useState(1)
    const [formData, setFormData] = useState<CreateChallengeFormData>({
        type: '',
        title: '',
        description: '',
        duration: '',
        badge: 0,
        color: '',
        gradient: '',
        selectedTypeData: null,
    })
    const [titleError, setTitleError] = useState('')
    const [descError, setDescError] = useState('')
    
    // Challenge 列表滚动
    const scroll = (direction: 'left' | 'right') => {
        if (flatListRef.current) {
            const scrollAmount = 300
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

    const handleScroll = (event: any) => {
        const newOffset = event.nativeEvent.contentOffset.x
        setScrollOffset(newOffset)
    }

    // Challenge 操作
    const handleJoinChallenge = (challengeId: string) => {
        setChallenges(
            challenges.map((challenge) =>
                challenge.id === challengeId 
                    ? { ...challenge, joined: !challenge.joined } 
                    : challenge
            )
        )
        setShowChallengeDetail(false)
    }

    // Post 操作
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

    // Challenge 创建表单函数
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

    const handleCreateChallenge = (selectedType: any) => {
        if (!formData.title || !formData.description || !formData.duration) {
            return
        }

        const selectedBadge = BADGE_DESIGNS[formData.badge]

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

    return {
        // Refs
        flatListRef,
        
        // Challenge states
        challenges,
        selectedChallenge,
        showChallengeDetail,
        showCreateChallenge,
        scrollOffset,
        
        // Post states
        posts,
        showCreatePost,
        
        // Create form states
        createStep,
        formData,
        titleError,
        descError,
        
        // Challenge setters
        setSelectedChallenge,
        setShowChallengeDetail,
        setShowCreateChallenge,
        setScrollOffset,
        
        // Post setters
        setShowCreatePost,
        
        // Form setters
        setCreateStep,
        setFormData,
        setTitleError,
        setDescError,
        
        // Action functions
        scroll,
        handleScroll,
        handleJoinChallenge,
        handleLikePost,
        handleCreatePost,
        handleCreateChallenge,
        resetChallengeForm,
    }
}
