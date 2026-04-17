import { 
    getImpactMetrics, 
    getFeed, 
    getMyTopics,
    createPost,
    addComment,
    likePost,
    unlikePost,
    followUser,
    unfollowUser,
    getFollowingFeed,
    joinTopic,
} from './index'
import { ApiError } from './client'
import { getSupabaseAccessToken, supabase } from '../lib/supabase'

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getActionSuccess(data: unknown): boolean | null {
    if (data && typeof data === 'object' && 'success' in data) {
        const success = (data as { success?: unknown }).success
        if (typeof success === 'boolean') {
            return success
        }
    }
    return null
}

/**
 * 检查当前的登录状态
 */
export async function checkAuthStatus() {
    console.log('\n🔐 === 认证状态检查 === 🔐\n')
    
    try {
        // 检查 Supabase 会话
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Supabase Session:', {
            isLoggedIn: !!session,
            user: session?.user?.email,
            userID: session?.user?.id,
        })
        
        // 检查 Token
        const token = await getSupabaseAccessToken()
        console.log('Access Token:', {
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
            tokenType: token ? token.split('.').length + ' parts' : 'none',
        })
        
        if (!session) {
            console.log('\n❌ 当前没有登录！')
            console.log('💡 请按以下步骤操作：')
            console.log('   1. 打开应用首页')
            console.log('   2. 点击"登录"按钮')
            console.log('   3. 使用已有账号登录')
            console.log('   4. 重新运行该测试')
            return false
        }
        
        console.log('\n✅ 已登录！可以开始测试需要认证的接口\n')
        return true
    } catch (error) {
        console.error('❌ 检查失败:', error)
        return false
    }
}

/**
 * 完整的 Community API 功能测试
 * 直接在重新加载时调用：pnpm start 后按 r 重启
 */
export async function quickTest() {
    console.log('\n🧪 === Community API 功能测试 === 🧪\n')

    let feedData: any[] = []
    let followTargetUserId: string | null = null

    try {
        // ========================================
        // 1️⃣ 测试获取影响指标
        // ========================================
        console.log('1️⃣ 测试 getImpactMetrics()...')
        try {
            const metrics = await getImpactMetrics()
            console.log('✅ 成功:', {
                code: metrics.code,
                hasData: !!metrics.data,
                dataType: typeof metrics.data,
            })
        } catch (e) {
            console.error('❌ 失败:', e instanceof Error ? e.message : e)
        }

        const loggedIn = await checkAuthStatus()
        if (!loggedIn) {
            console.log('\n⏭️ 未登录，跳过 2️⃣-1️⃣1️⃣ 受保护接口测试（Feed/Follow/Like/Post/Topic）')
            console.log('✅ 公开接口测试完成\n')
            return
        }

        // ========================================
        // 2️⃣ 测试获取 Feed
        // ========================================
        console.log('\n2️⃣ 测试 getFeed(0, 5)...')
        try {
            const feed = await getFeed(0, 5)
            feedData = feed.data || []
            const {
                data: { session },
            } = await supabase.auth.getSession()
            const currentUserId = session?.user?.id
            followTargetUserId =
                feedData.find(
                    (p: any) =>
                        typeof p?.userId === 'string' &&
                        UUID_REGEX.test(p.userId) &&
                        p.userId !== currentUserId
                )?.userId ?? null

            console.log('✅ 成功，帖子数:', feedData.length)
            if (feedData.length > 0) {
                console.log('   首条帖子:', {
                    id: feedData[0].id,
                    title: feedData[0].title,
                    authorNickname: feedData[0].authorNickname,
                    likeCount: feedData[0].likeCount,
                })
            }
            console.log('   Follow 测试目标用户:', followTargetUserId || '未找到可用 UUID 用户，稍后将跳过 7️⃣/8️⃣')
        } catch (e) {
            console.error('❌ 失败:', e instanceof Error ? e.message : e)
        }

        // ========================================
        // 3️⃣ 测试创建帖子
        // ========================================
        console.log('\n3️⃣ 测试 createPost()...')
        try {
            const newPost = await createPost({
                title: '🧪 Test Post',
                content: '这是一个自动化测试帖子 - 可以删除',
                imageUrl: null,
            })
            const postData = newPost.data as any
            console.log('✅ 成功:', {
                id: postData?.id,
                title: postData?.title,
                content: postData?.content,
                createdAt: postData?.createdAt,
            })
        } catch (e) {
            console.error('❌ 失败:', e instanceof Error ? e.message : e)
        }

        // ========================================
        // 4️⃣ 测试点赞帖子
        // ========================================
        if (feedData.length > 0 && feedData[0].id) {
            const postToLike = feedData[0].id
            console.log('\n4️⃣ 测试 likePost(postId: ' + postToLike + ')...')
            try {
                const result = await likePost(postToLike)
                console.log('✅ 成功:', {
                    code: result.code,
                    message: result.message,
                    actionSuccess: getActionSuccess(result.data),
                    rawData: result.data,
                })
            } catch (e) {
                console.error('❌ 失败:', e instanceof Error ? e.message : e)
            }

            // ========================================
            // 5️⃣ 测试取消点赞
            // ========================================
            console.log('\n5️⃣ 测试 unlikePost(postId: ' + postToLike + ')...')
            try {
                const result = await unlikePost(postToLike)
                console.log('✅ 成功:', {
                    code: result.code,
                    message: result.message,
                    actionSuccess: getActionSuccess(result.data),
                    rawData: result.data,
                })
            } catch (e) {
                console.error('❌ 失败:', e instanceof Error ? e.message : e)
            }

            // ========================================
            // 6️⃣ 测试添加评论
            // ========================================
            console.log('\n6️⃣ 测试 addComment(postId: ' + postToLike + ')...')
            try {
                const comment = await addComment(postToLike, {
                    content: '🧪 这是一个测试评论',
                })
                const commentData = comment.data as any
                console.log('✅ 成功:', {
                    id: commentData.id,
                    content: commentData.content,
                    createdAt: commentData.createdAt,
                })
            } catch (e) {
                console.error('❌ 失败:', e instanceof Error ? e.message : e)
            }
        }

        // ========================================
        // 7️⃣ 测试关注用户
        // ========================================
        if (followTargetUserId) {
            console.log(`\n7️⃣ 测试 followUser(userId: "${followTargetUserId}")...`)
            try {
                const result = await followUser(followTargetUserId)
                console.log('✅ 成功:', {
                    code: result.code,
                    message: result.message,
                    actionSuccess: getActionSuccess(result.data),
                    rawData: result.data,
                })
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) {
                    console.log('⚠️ 404 Not Found - 用户不存在（预期）')
                } else {
                    console.error('❌ 失败:', e instanceof Error ? e.message : e)
                }
            }
        } else {
            console.log('\n7️⃣ 跳过 followUser：当前 Feed 未找到可用 UUID 目标用户')
        }

        // ========================================
        // 8️⃣ 测试取消关注
        // ========================================
        if (followTargetUserId) {
            console.log(`\n8️⃣ 测试 unfollowUser(userId: "${followTargetUserId}")...`)
            try {
                const result = await unfollowUser(followTargetUserId)
                console.log('✅ 成功:', {
                    code: result.code,
                    message: result.message,
                    actionSuccess: getActionSuccess(result.data),
                    rawData: result.data,
                })
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) {
                    console.log('⚠️ 404 Not Found - 用户不存在（预期）')
                } else {
                    console.error('❌ 失败:', e instanceof Error ? e.message : e)
                }
            }
        } else {
            console.log('\n8️⃣ 跳过 unfollowUser：当前 Feed 未找到可用 UUID 目标用户')
        }

        // ========================================
        // 9️⃣ 测试获取关注者 Feed
        // ========================================
        console.log('\n9️⃣ 测试 getFollowingFeed()...')
        try {
            const followingFeed = await getFollowingFeed()
            console.log('✅ 成功，帖子数:', followingFeed.data?.length || 0)
            if (followingFeed.data?.length) {
                console.log('   首条帖子:', {
                    id: followingFeed.data[0].id,
                    title: followingFeed.data[0].title,
                })
            }
        } catch (e) {
            console.error('❌ 失败:', e instanceof Error ? e.message : e)
        }

        // ========================================
        // 🔟 测试加入话题
        // ========================================
        console.log('\n🔟 测试 joinTopic(topicName: "测试话题")...')
        try {
            const result = await joinTopic('测试话题')
            console.log('✅ 成功:', {
                code: result.code,
                message: result.message,
                actionSuccess: getActionSuccess(result.data),
                rawData: result.data,
            })
        } catch (e) {
            if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
                console.log('⚠️ 话题操作有问题:', e.message)
            } else {
                console.error('❌ 失败:', e instanceof Error ? e.message : e)
            }
        }

        // ========================================
        // 1️⃣1️⃣ 测试获取我的话题
        // ========================================
        console.log('\n1️⃣1️⃣ 测试 getMyTopics()...')
        try {
            const topics = await getMyTopics()
            console.log('✅ 成功:', {
                count: topics.data?.length || 0,
                topics: topics.data,
            })
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) {
                console.log('⚠️ 401 Unauthorized - JWT认证失败（需要登录）')
            } else {
                console.error('❌ 失败:', e instanceof Error ? e.message : e)
            }
        }

        console.log('\n✅ === 测试完成 === ✅\n')
    } catch (error) {
        console.error('\n❌ === 测试失败 === ❌')
        if (error instanceof ApiError) {
            console.error('API错误:', {
                status: error.status,
                message: error.message,
            })
        } else if (error instanceof Error) {
            console.error('错误:', error.message)
        } else {
            console.error('未知错误:', error)
        }
        console.log()
    }
}
