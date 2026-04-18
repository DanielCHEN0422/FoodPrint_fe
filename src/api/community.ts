import { apiDelete, apiGet, apiPost } from './client'
import type {
    ApiResponse,
    CommentResponse,
    CreateCommentRequest,
    CreatePostRequest,
    ImpactMetricsResponse,
    PostResponse,
} from './types'

const BASE = 'api/community'

/** GET /api/community/impact-metrics - 获取社区影响指标 */
export async function getImpactMetrics(): Promise<ApiResponse<ImpactMetricsResponse>> {
    return apiGet<ImpactMetricsResponse>(`${BASE}/impact-metrics`)
}

/** POST /api/community/posts - 创建帖子 */
export async function createPost(
    body: CreatePostRequest
): Promise<ApiResponse<PostResponse>> {
    return apiPost<PostResponse>(`${BASE}/posts`, body, { requireAuth: true })
}

/** GET /api/community/posts?page=0&size=10 - 获取Feed */
export async function getFeed(page = 0, size = 10): Promise<ApiResponse<PostResponse[]>> {
    return apiGet<PostResponse[]>(`${BASE}/posts?page=${page}&size=${size}`, { requireAuth: true })
}

/** POST /api/community/posts/{id}/comments - 添加评论 */
export async function addComment(
    postId: string | number,
    body: CreateCommentRequest
): Promise<ApiResponse<CommentResponse>> {
    return apiPost<CommentResponse>(`${BASE}/posts/${postId}/comments`, body, { requireAuth: true })
}

/** POST /api/community/posts/{id}/like - 点赞帖子 */
export async function likePost(postId: string | number): Promise<ApiResponse<unknown>> {
    return apiPost(`${BASE}/posts/${postId}/like`, undefined, { requireAuth: true })
}

/** DELETE /api/community/posts/{id}/like - 取消点赞 */
export async function unlikePost(postId: string | number): Promise<ApiResponse<unknown>> {
    return apiDelete(`${BASE}/posts/${postId}/like`, { requireAuth: true })
}

/** POST /api/community/users/{userId}/follow - 关注用户 */
export async function followUser(userId: string): Promise<ApiResponse<unknown>> {
    return apiPost(`${BASE}/users/${userId}/follow`, undefined, { requireAuth: true })
}

/** DELETE /api/community/users/{userId}/follow - 取消关注 */
export async function unfollowUser(userId: string): Promise<ApiResponse<unknown>> {
    return apiDelete(`${BASE}/users/${userId}/follow`, { requireAuth: true })
}

/** GET /api/community/posts/following - 获取关注用户的Feed */
export async function getFollowingFeed(): Promise<ApiResponse<PostResponse[]>> {
    return apiGet<PostResponse[]>(`${BASE}/posts/following`, { requireAuth: true })
}

/** POST /api/community/topics/{topicName}/join - 加入话题 */
export async function joinTopic(topicName: string): Promise<ApiResponse<unknown>> {
    return apiPost(`${BASE}/topics/${encodeURIComponent(topicName)}/join`, undefined, { requireAuth: true })
}

/** GET /api/community/my-topics - 获取我的话题 */
export async function getMyTopics(): Promise<ApiResponse<string[]>> {
    return apiGet<string[]>(`${BASE}/my-topics`, { requireAuth: true })
}

/** DELETE /api/community/posts/{id} - 删除帖子 */
export async function deletePost(postId: string | number): Promise<ApiResponse<unknown>> {
    return apiDelete(`${BASE}/posts/${postId}`, { requireAuth: true })
}

/** DELETE /api/community/comments/{id} - 删除评论 */
export async function deleteComment(
    commentId: string | number
): Promise<ApiResponse<unknown>> {
    return apiDelete(`${BASE}/comments/${commentId}`, { requireAuth: true })
}
