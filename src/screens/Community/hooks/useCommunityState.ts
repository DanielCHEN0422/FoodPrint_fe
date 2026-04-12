import { useState, useRef } from 'react'
import { FlatList } from 'react-native'
import { CommunityChallenge, Post, CreateChallengeFormData, Comment } from '../types'
import { SAMPLE_CHALLENGES, SAMPLE_POSTS, BADGE_DESIGNS } from '../constants'
import type { PostResponse } from '../../../api/types'
import {
    addComment,
    createPost,
    followUser,
    unfollowUser,
    joinTopic,
    getFeed,
    getMyTopics,
    getFollowingFeed,
    likePost,
    unlikePost,
} from '../../../api/community'

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const mapApiPostToUiPost = (post: PostResponse): Post => {
    const commentList: Comment[] = Array.isArray(post.comments)
        ? post.comments.map((comment) => ({
              id: String(comment.id),
              authorName: comment.authorNickname || 'Unknown User',
              authorImage: comment.authorAvatarUrl || 'https://i.pravatar.cc/32?img=1',
              text: comment.content,
              timestamp: comment.createdAt,
          }))
        : []

    return {
        id: String(post.id),
        authorId: post.userId,
        authorName: post.authorNickname || 'Unknown User',
        authorImage: post.authorAvatarUrl || 'https://i.pravatar.cc/48?img=1',
        timestamp: post.createdAt,
        text: post.content,
        image: post.imageUrl || '',
        likes: post.likeCount,
        comments: commentList.length,
        userLiked: post.likedByCurrentUser,
        commentList,
    }
}

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

    // 关注和话题状态
    const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
    const [myTopics, setMyTopics] = useState<string[]>([])
    const [followingFeed, setFollowingFeed] = useState<Post[]>([])
    const [feedTab, setFeedTab] = useState<'all' | 'following'>('all')
    
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
    const handleLikePost = async (postId: string) => {
        const target = posts.find((post) => post.id === postId)
        if (!target) {
            return
        }

        const wasLiked = !!target.userLiked

        setPosts(
            posts.map((post) =>
                post.id === postId
                    ? {
                          ...post,
                          userLiked: !wasLiked,
                          likes: wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
                      }
                    : post
            )
        )

        try {
            if (wasLiked) {
                await unlikePost(postId)
            } else {
                await likePost(postId)
            }
        } catch (error) {
            // 回滚 optimistic 更新
            setPosts(
                posts.map((post) =>
                    post.id === postId
                        ? {
                              ...post,
                              userLiked: wasLiked,
                              likes: wasLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
                          }
                        : post
                )
            )
            console.error('❌ Like operation failed:', error)
        }
    }

    const handleAddComment = async (postId: string, content: string) => {
        const text = content.trim()
        if (!text) {
            return
        }

        try {
            const response = await addComment(postId, { content: text })
            const dto = response.data as any

            if (!dto) {
                console.warn('⚠️ Comment response is empty')
                return
            }

            setPosts(
                posts.map((post) => {
                    if (post.id !== postId) {
                        return post
                    }

                    const newComment: Comment = {
                        id: String(dto.id ?? Date.now()),
                        authorName: dto.authorNickname || 'You',
                        authorImage: dto.authorAvatarUrl || 'https://i.pravatar.cc/32?img=2',
                        text,
                        timestamp: dto.createdAt || 'Just now',
                    }

                    return {
                        ...post,
                        comments: post.comments + 1,
                        commentList: [...(post.commentList || []), newComment],
                    }
                })
            )
        } catch (error) {
            console.error('❌ Add comment failed:', error)
        }
    }

    const handleFollowUser = async (authorId: string) => {
        try {
            if (!UUID_REGEX.test(authorId)) {
                console.warn(`⚠️ Skip follow: authorId is not a valid UUID (${authorId})`)
                return
            }
            const newFollowedUsers = new Set(followedUsers)

            if (newFollowedUsers.has(authorId)) {
                await unfollowUser(authorId)
                newFollowedUsers.delete(authorId)
            } else {
                await followUser(authorId)
                newFollowedUsers.add(authorId)
            }
            setFollowedUsers(newFollowedUsers)
            
            // Follow 后等待 500ms 确保后端处理完成，再刷新 following feed
            setTimeout(async () => {
                await handleLoadFollowingFeed()
            }, 500)
        } catch (error) {
            console.error('❌ Follow operation failed:', error)
        }
    }

    const handleJoinTopic = async (topicName: string) => {
        try {
            await joinTopic(topicName)

            const newTopics = [...myTopics]
            if (!newTopics.includes(topicName)) {
                newTopics.push(topicName)
                setMyTopics(newTopics)
            }
        } catch (error) {
            console.error('❌ Join topic failed:', error)
        }
    }

    const handleLoadFollowingFeed = async () => {
        try {
            const response = await getFollowingFeed()
            const postsArray = Array.isArray(response.data) ? response.data : []
            console.log('Following feed loaded:', postsArray.length)
            const mappedPosts = postsArray.map(mapApiPostToUiPost)
            setFollowingFeed(mappedPosts)
        } catch (error) {
            console.error('❌ Load following feed failed:', error)
            setFollowingFeed([])
        }
    }

    const handleLoadFeed = async () => {
        try {
            const response = await getFeed(0, 20)
            const postsArray = Array.isArray(response.data) ? response.data : []
            const mappedPosts = postsArray.map(mapApiPostToUiPost)
            setPosts(mappedPosts)
        } catch (error) {
            console.error('❌ Load feed failed:', error)
        }
    }

    const handleLoadMyTopics = async () => {
        try {
            const response = await getMyTopics()
            const topicsArray = Array.isArray(response.data) ? response.data : []
            setMyTopics(topicsArray)
        } catch (error) {
            console.error('❌ Load my topics failed:', error)
            setMyTopics([])
        }
    }

    const handleCreatePost = async (newPostData: { text: string; image: string }) => {
        try {
            const title =
                newPostData.text.length > 30
                    ? newPostData.text.substring(0, 30) + '...'
                    : newPostData.text

            const requestPayload = {
                title,
                content: newPostData.text,
                imageUrl: newPostData.image || null,
            }

            const response = await createPost(requestPayload)
            const postData = response.data as any

            if (postData && postData.id) {
                // 用统一的转换函数
                const newPost = mapApiPostToUiPost(postData as PostResponse)
                setPosts([newPost, ...posts])
            }

            setShowCreatePost(false)
        } catch (error) {
            console.error('❌ [Hook] 创建帖子失败:', error)
            throw error
        }
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
        followedUsers,
        myTopics,
        followingFeed,
        feedTab,
        
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
        setPosts,
        setFollowedUsers,
        setMyTopics,
        setFollowingFeed,
        setFeedTab,
        
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
        handleAddComment,
        handleFollowUser,
        handleJoinTopic,
        handleLoadFeed,
        handleLoadFollowingFeed,
        handleLoadMyTopics,
        handleCreatePost,
        handleCreateChallenge,
        resetChallengeForm,
    }
}
