import { useState, useRef } from 'react';
import { Alert, FlatList } from 'react-native';
import { CommunityChallenge, Post, CreateChallengeFormData, Comment } from '../types';
import { SAMPLE_POSTS, BADGE_DESIGNS } from '../constants';
import { supabase } from '../../../lib/supabase';
import type { ChallengeResponse, PostResponse, UserChallengeResponse } from '../../../api/types';
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
  deletePost,
  deleteComment,
} from '../../../api/community';
import {
  abandonChallenge,
  checkinChallenge,
  createChallenge,
  getChallenges,
  getMyChallenges,
  getTodayStatus,
  getUserChallengeDetail,
  joinChallenge,
} from '../../../api/challenge';
import { uploadImageToSupabase } from '../../../api/upload';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatTimeStamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    // 移除毫秒部分 (.123Z 或 .123)
    return timestamp.replace(/\.\d{3}(Z)?$/, '$1');
  }
};

const mapApiPostToUiPost = (post: PostResponse): Post => {
  const commentList: Comment[] = Array.isArray(post.comments)
    ? post.comments.map(comment => ({
        id: String(comment.id),
        authorId: comment.userId,
        authorName: comment.authorNickname || 'Unknown User',
        authorImage: comment.authorAvatarUrl || 'https://i.pravatar.cc/32?img=1',
        text: comment.content,
        timestamp: formatTimeStamp(comment.createdAt),
      }))
    : [];

  return {
    id: String(post.id),
    authorId: post.userId,
    authorName: post.authorNickname || 'Unknown User',
    authorImage: post.authorAvatarUrl || 'https://i.pravatar.cc/48?img=1',
    timestamp: formatTimeStamp(post.createdAt),
    text: post.content,
    image: post.imageUrl || '',
    likes: post.likeCount,
    comments: commentList.length,
    userLiked: post.likedByCurrentUser,
    commentList,
  };
};

const CHALLENGE_COLORS = ['#8BA888', '#F4A261', '#5BA8C4', '#A8C5A0', '#C47BA0'];
const BADGE_GRADIENTS: Record<string, string> = {
  CALORIE_CONTROL: '#F0E7D8',
  PROTEIN_CHAMPION: '#F3E0EC',
  LOG_STREAK: '#FDF3E5',
  LOW_CARB: '#E0F2FE',
  LIGHT_EATER: '#E8F8E8',
};

const getChallengeColor = (type: string | undefined, index = 0) => {
  switch (type) {
    case 'CALORIE_CONTROL':
      return '#8BA888';
    case 'PROTEIN_CHAMPION':
      return '#C47BA0';
    case 'LOG_STREAK':
      return '#F4A261';
    case 'LOW_CARB':
      return '#5BA8C4';
    case 'LIGHT_EATER':
      return '#A8C5A0';
    default:
      return CHALLENGE_COLORS[index % CHALLENGE_COLORS.length];
  }
};

const getBadgeGradient = (type: string | undefined) => {
  return BADGE_GRADIENTS[type as string] || '#FFF8E7';
};

const buildBadgeName = (challenge: ChallengeResponse) =>
  `${challenge.title} ${challenge.badgeIcon || 'Badge'}`;

const mapApiChallengeToUiChallenge = (
  challenge: ChallengeResponse,
  index = 0,
  userChallenge?: UserChallengeResponse
): CommunityChallenge => ({
  id: challenge.id,
  userChallengeId: userChallenge?.id,
  title: challenge.title,
  description: challenge.description,
  duration: `${challenge.durationDays} Days`,
  participants: 0,
  color: getChallengeColor(challenge.type, index),
  joined: userChallenge?.status === 'IN_PROGRESS',
  fullDescription: challenge.description,
  icon: challenge.badgeIcon || '🏆',
  streak: userChallenge?.currentStreak,
  status: userChallenge?.status,
  startDate: userChallenge?.startDate,
  endDate: userChallenge?.endDate,
  completedDays: userChallenge?.completedDays,
  progressPercent: userChallenge?.progressPercent,
  type: challenge.type,
  targetValue: challenge.targetValue,
  checkins: userChallenge?.checkins?.map(checkin => ({
    date: new Date(checkin.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    passed: checkin.passed,
    actualValue: checkin.actualValue,
    note: checkin.note,
  })),
  badge: {
    name: buildBadgeName(challenge),
    image: '',
    description: `Complete ${challenge.durationDays} days of ${challenge.title} to earn this badge.`,
    icon: challenge.badgeIcon || '🏆',
    badgeGradient: getBadgeGradient(challenge.type),
  },
  topParticipants: [],
});

const mergeChallengesWithUserRuns = (
  templates: ChallengeResponse[],
  userRuns: UserChallengeResponse[]
) => {
  const activeRunsByChallengeId = new Map(
    userRuns
      .filter(run => run.challenge?.id && run.status === 'IN_PROGRESS')
      .map(run => [run.challenge.id, run])
  );

  return templates.map((challenge, index) =>
    mapApiChallengeToUiChallenge(challenge, index, activeRunsByChallengeId.get(challenge.id))
  );
};

export const useCommunityState = () => {
  const flatListRef = useRef<FlatList>(null);

  // Challenge 相关状态
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Post 相关状态
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // 关注和话题状态
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [myTopics, setMyTopics] = useState<string[]>([]);
  const [followingFeed, setFollowingFeed] = useState<Post[]>([]);
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all');

  // Challenge 创建表单状态
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState<CreateChallengeFormData>({
    type: '',
    title: '',
    description: '',
    duration: '',
    badge: 0,
    color: '',
    gradient: '',
    selectedTypeData: null,
  });
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');

  // Challenge 列表滚动
  const scroll = (direction: 'left' | 'right') => {
    if (flatListRef.current) {
      const scrollAmount = 300;
      const newOffset =
        direction === 'left'
          ? Math.max(0, scrollOffset - scrollAmount)
          : scrollOffset + scrollAmount;

      flatListRef.current.scrollToOffset({
        offset: newOffset,
        animated: true,
      });
      setScrollOffset(newOffset);
    }
  };

  const handleScroll = (event: any) => {
    const newOffset = event.nativeEvent.contentOffset.x;
    setScrollOffset(newOffset);
  };

  // Challenge 操作
  const handleLoadChallenges = async () => {
    try {
      const [templateResponse, myChallengeResponse] = await Promise.all([
        getChallenges(),
        getMyChallenges().catch(error => {
          console.warn('⚠️ Load my challenges failed:', error);
          return { data: [] as UserChallengeResponse[] };
        }),
      ]);

      const templates = Array.isArray(templateResponse.data) ? templateResponse.data : [];
      const myChallenges = Array.isArray(myChallengeResponse.data) ? myChallengeResponse.data : [];

      setChallenges(mergeChallengesWithUserRuns(templates, myChallenges));
    } catch (error) {
      console.error('❌ Load challenges failed:', error);
    }
  };

  const refreshSelectedChallengeDetail = async (challenge: CommunityChallenge) => {
    if (!challenge.userChallengeId) {
      return challenge;
    }

    const response = await getUserChallengeDetail(challenge.userChallengeId);
    const detail = response.data;
    if (!detail?.challenge) {
      return challenge;
    }

    const updated = mapApiChallengeToUiChallenge(detail.challenge, 0, detail);
    setSelectedChallenge(updated);
    setChallenges(current =>
      current.map(item => (item.id === updated.id ? { ...item, ...updated } : item))
    );
    return updated;
  };

  const handleLoadChallengeDetail = async (challenge: CommunityChallenge) => {
    try {
      await refreshSelectedChallengeDetail(challenge);
    } catch (error) {
      console.error('❌ Load challenge detail failed:', error);
    }
  };

  const applyUserChallengeRun = (run: UserChallengeResponse) => {
    if (!run.challenge) {
      return null;
    }

    const existing =
      selectedChallenge?.id === run.challenge.id
        ? selectedChallenge
        : challenges.find(challenge => challenge.id === run.challenge.id);
    const updated = {
      ...mapApiChallengeToUiChallenge(run.challenge, 0, run),
      color: existing?.color ?? getChallengeColor(run.challenge.type),
    };

    setChallenges(current =>
      current.map(challenge =>
        challenge.id === updated.id
          ? {
              ...challenge,
              ...updated,
            }
          : challenge
      )
    );
    setSelectedChallenge(current =>
      current?.id === updated.id
        ? {
            ...current,
            ...updated,
          }
        : current
    );

    return updated;
  };

  const loadActiveUserChallengeRun = async (challengeId: string) => {
    const response = await getMyChallenges();
    const myChallenges = Array.isArray(response.data) ? response.data : [];
    const activeRun = myChallenges.find(
      run => run.challenge?.id === challengeId && run.status === 'IN_PROGRESS'
    );

    return activeRun ? applyUserChallengeRun(activeRun) : null;
  };

  const handleJoinChallenge = async (challengeId: string) => {
    const target = challenges.find(challenge => challenge.id === challengeId);
    if (!target) {
      return;
    }

    if (target.joined && target.userChallengeId) {
      Alert.alert('Already joined', 'Use the detail view to check in or abandon this challenge.');
      return;
    }

    try {
      // 只有从后端加载的 Challenge（UUID 格式）才能加入
      if (!UUID_REGEX.test(challengeId)) {
        Alert.alert(
          'Cannot Join',
          'Only system challenges can be joined. This appears to be a locally created challenge.'
        );
        return;
      }

      if (target.joined && !target.userChallengeId) {
        const activeRun = await loadActiveUserChallengeRun(challengeId);
        if (activeRun?.userChallengeId) {
          Alert.alert(
            'Already joined',
            'Use the detail view to check in or abandon this challenge.'
          );
          return;
        }
      }

      const response = await joinChallenge(challengeId);
      if (response.data?.challenge) {
        const updated = mapApiChallengeToUiChallenge(response.data.challenge, 0, response.data);
        setChallenges(current =>
          current.map(challenge =>
            challenge.id === challengeId ? { ...challenge, ...updated } : challenge
          )
        );
        setSelectedChallenge(updated);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Join challenge failed';
      Alert.alert('Could not join challenge', message);
      console.error('❌ Join challenge failed:', error);
    }
  };

  const handleCheckinChallenge = async (challengeId: string) => {
    try {
      let target: CommunityChallenge | null | undefined =
        selectedChallenge?.id === challengeId && selectedChallenge.userChallengeId
          ? selectedChallenge
          : challenges.find(challenge => challenge.id === challengeId);

      if (!target?.userChallengeId) {
        target = await loadActiveUserChallengeRun(challengeId);
      }

      if (!target?.userChallengeId) {
        Alert.alert('Join first', 'Please join this challenge before checking in.');
        return;
      }

      // 在 checkin 前刷新一下这个 userChallenge 的最新状态，确保是 IN_PROGRESS
      const latestDetail = await getUserChallengeDetail(target.userChallengeId);
      if (latestDetail.data?.status !== 'IN_PROGRESS') {
        Alert.alert(
          'Challenge Not Active',
          `This challenge is no longer active (status: ${latestDetail.data?.status}). Please try to rejoin.`
        );
        return;
      }

      const response = await checkinChallenge(target.userChallengeId);
      await refreshSelectedChallengeDetail(target);
      await handleLoadChallenges();
      const checkin = response.data;
      Alert.alert(
        checkin?.passed ? 'Check-in passed' : 'Check-in recorded',
        checkin?.message || checkin?.note || 'Your check-in has been recorded.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-in failed';
      Alert.alert('Could not check in', message);
      console.error('❌ Challenge check-in failed:', error);
    }
  };

  const handleAbandonChallenge = async (challengeId: string) => {
    try {
      let target: CommunityChallenge | null | undefined =
        selectedChallenge?.id === challengeId && selectedChallenge.userChallengeId
          ? selectedChallenge
          : challenges.find(challenge => challenge.id === challengeId);

      if (!target?.userChallengeId) {
        target = await loadActiveUserChallengeRun(challengeId);
      }

      if (!target?.userChallengeId) {
        return;
      }

      await abandonChallenge(target.userChallengeId);
      setChallenges(current =>
        current.map(challenge =>
          challenge.id === challengeId
            ? {
                ...challenge,
                joined: false,
                userChallengeId: undefined,
                status: 'ABANDONED',
                streak: undefined,
                completedDays: undefined,
                progressPercent: undefined,
                checkins: undefined,
              }
            : challenge
        )
      );
      setSelectedChallenge(current =>
        current?.id === challengeId
          ? {
              ...current,
              joined: false,
              userChallengeId: undefined,
              status: 'ABANDONED',
              streak: undefined,
              completedDays: undefined,
              progressPercent: undefined,
              checkins: undefined,
            }
          : current
      );
      Alert.alert('Challenge abandoned', 'You can join it again whenever you are ready.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Abandon challenge failed';
      Alert.alert('Could not abandon challenge', message);
      console.error('❌ Abandon challenge failed:', error);
    }
  };

  // Post 操作
  const handleLikePost = async (postId: string) => {
    const target = posts.find(post => post.id === postId);
    if (!target) {
      return;
    }

    const wasLiked = !!target.userLiked;

    setPosts(
      posts.map(post =>
        post.id === postId
          ? {
              ...post,
              userLiked: !wasLiked,
              likes: wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post
      )
    );

    try {
      if (wasLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (error) {
      // 回滚 optimistic 更新
      setPosts(
        posts.map(post =>
          post.id === postId
            ? {
                ...post,
                userLiked: wasLiked,
                likes: wasLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
              }
            : post
        )
      );
      console.error('❌ Like operation failed:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    const text = content.trim();
    if (!text) {
      return;
    }

    try {
      const response = await addComment(postId, { content: text });
      const dto = response.data as any;

      if (!dto) {
        console.warn('⚠️ Comment response is empty');
        return;
      }

      setPosts(
        posts.map(post => {
          if (post.id !== postId) {
            return post;
          }

          const newComment: Comment = {
            id: String(dto.id ?? Date.now()),
            authorId: dto.userId,
            authorName: dto.authorNickname || 'You',
            authorImage: dto.authorAvatarUrl || 'https://i.pravatar.cc/32?img=2',
            text,
            timestamp: dto.createdAt || 'Just now',
          };

          return {
            ...post,
            comments: post.comments + 1,
            commentList: [...(post.commentList || []), newComment],
          };
        })
      );
    } catch (error) {
      console.error('❌ Add comment failed:', error);
    }
  };

  const handleFollowUser = async (authorId: string) => {
    try {
      if (!UUID_REGEX.test(authorId)) {
        console.warn(`⚠️ Skip follow: authorId is not a valid UUID (${authorId})`);
        return;
      }

      const newFollowedUsers = new Set(followedUsers);

      if (newFollowedUsers.has(authorId)) {
        await unfollowUser(authorId);
        newFollowedUsers.delete(authorId);
      } else {
        await followUser(authorId);
        newFollowedUsers.add(authorId);
      }
      setFollowedUsers(newFollowedUsers);

      // Follow 后等待 500ms 确保后端处理完成，再刷新 following feed
      setTimeout(async () => {
        await handleLoadFollowingFeed();
      }, 500);
    } catch (error) {
      console.error('❌ Follow operation failed:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    return new Promise<void>((resolve) => {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const postToDelete = posts.find(p => p.id === postId);
                if (!postToDelete) {
                  resolve();
                  return;
                }

                // 乐观更新：立即移除帖子
                setPosts(posts.filter(post => post.id !== postId));
                setFollowingFeed(followingFeed.filter(post => post.id !== postId));

                // 调用 API 删除
                await deletePost(postId);
                console.log('✅ Post deleted successfully');
                resolve();
              } catch (error) {
                console.error('❌ Delete post failed:', error);
                // 错误时重新加载 feed
                await handleLoadFeed();
                await handleLoadFollowingFeed();
                Alert.alert('Delete Failed', 'Could not delete the post. Please try again.');
                resolve();
              }
            },
          },
        ]
      );
    });
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    return new Promise<void>((resolve) => {
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          {
            text: 'Cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // 乐观更新：立即移除评论
                setPosts(
                  posts.map(post =>
                    post.id === postId
                      ? {
                          ...post,
                          comments: Math.max(0, post.comments - 1),
                          commentList: (post.commentList || []).filter(c => c.id !== commentId),
                        }
                      : post
                  )
                );

                setFollowingFeed(
                  followingFeed.map(post =>
                    post.id === postId
                      ? {
                          ...post,
                          comments: Math.max(0, post.comments - 1),
                          commentList: (post.commentList || []).filter(c => c.id !== commentId),
                        }
                      : post
                  )
                );

                // 调用 API 删除
                await deleteComment(commentId);
                console.log('✅ Comment deleted successfully');
                resolve();
              } catch (error) {
                console.error('❌ Delete comment failed:', error);
                // 错误时重新加载 feed
                await handleLoadFeed();
                await handleLoadFollowingFeed();
                Alert.alert('Delete Failed', 'Could not delete the comment. Please try again.');
                resolve();
              }
            },
          },
        ]
      );
    });
  };

  const handleJoinTopic = async (topicName: string) => {
    try {
      await joinTopic(topicName);

      const newTopics = [...myTopics];
      if (!newTopics.includes(topicName)) {
        newTopics.push(topicName);
        setMyTopics(newTopics);
      }
    } catch (error) {
      console.error('❌ Join topic failed:', error);
    }
  };

  const handleLoadFollowingFeed = async () => {
    try {
      const response = await getFollowingFeed();
      const postsArray = Array.isArray(response.data) ? response.data : [];
      console.log('Following feed loaded:', postsArray.length);
      const mappedPosts = postsArray.map(mapApiPostToUiPost);
      setFollowingFeed(mappedPosts);
    } catch (error) {
      console.error('❌ Load following feed failed:', error);
      setFollowingFeed([]);
    }
  };

  const handleLoadFeed = async () => {
    try {
      const response = await getFeed(0, 20);
      const postsArray = Array.isArray(response.data) ? response.data : [];
      const mappedPosts = postsArray.map(mapApiPostToUiPost);
      setPosts(mappedPosts);
      console.log('✅ Feed loaded:', mappedPosts.length, 'posts');
    } catch (error) {
      console.error('❌ Load feed failed:', error);
      // 降级到mock data
      console.warn('⚠️ Using sample data as fallback');
      setPosts(SAMPLE_POSTS);
    }
  };

  const handleLoadMyTopics = async () => {
    try {
      const response = await getMyTopics();
      const topicsArray = Array.isArray(response.data) ? response.data : [];
      setMyTopics(topicsArray);
    } catch (error) {
      console.error('❌ Load my topics failed:', error);
      setMyTopics([]);
    }
  };

  const handleCreatePost = async (newPostData: { text: string; image: string }) => {
    try {
      const title =
        newPostData.text.length > 30 ? newPostData.text.substring(0, 30) + '...' : newPostData.text;

      let imageUrl: string | null = null;

      // 如果有图片，先上传到 Supabase Storage
      if (newPostData.image && newPostData.image.trim()) {
        try {
          console.log('📤 开始上传图片...');
          imageUrl = await uploadImageToSupabase(newPostData.image, 'posts');
          console.log('✅ 图片上传成功:', imageUrl);
        } catch (uploadError) {
          console.error('❌ 图片上传失败:', uploadError);
          Alert.alert('Upload Failed', 'Failed to upload image. Post created without image.');
          // 继续创建 post，只是没有图片
        }
      }

      const requestPayload = {
        title,
        content: newPostData.text,
        imageUrl: imageUrl || null,
      };

      const response = await createPost(requestPayload);
      const postData = response.data as any;

      if (postData && postData.id) {
        // 用统一的转换函数
        const newPost = mapApiPostToUiPost(postData as PostResponse);
        setPosts([newPost, ...posts]);
      }

      setShowCreatePost(false);
    } catch (error) {
      console.error('❌ [Hook] 创建帖子失败:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
      throw error;
    }
  };

  // Challenge 创建表单函数
  const resetChallengeForm = () => {
    setCreateStep(1);
    setFormData({
      type: '',
      title: '',
      description: '',
      duration: '',
      badge: 0,
      color: '',
      gradient: '',
      selectedTypeData: null,
    });
    setTitleError('');
    setDescError('');
  };

  const handleCreateChallenge = async (selectedType: any) => {
    // 验证必填字段
    if (!formData.title?.trim()) {
      Alert.alert('Validation Error', 'Challenge title is required.');
      return;
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      Alert.alert('Validation Error', 'Duration must be at least 1 day.');
      return;
    }

    if (!selectedType?.id) {
      Alert.alert('Validation Error', 'Please select a challenge type.');
      return;
    }

    try {
      // 映射前端类型到系统类型
      // ⚠️ 重要：后端限制每个 type 只能创建一个 challenge
      // 用户在创建时必须选择一个系统类型
      const typeMapping: Record<string, string> = {
        nutrition: 'CALORIE_CONTROL',
        hydration: 'LOW_CARB',
        restriction: 'PROTEIN_CHAMPION',
        fitness: 'LOG_STREAK',
        habit: 'LIGHT_EATER',
      };

      const backendType = typeMapping[selectedType.id];
      
      if (!backendType) {
        Alert.alert('Error', 'Invalid challenge type selected.');
        return;
      }

      // 检查是否已经创建过这个类型的 challenge
      const existingChallenge = challenges.find(c => c.type === backendType);
      if (existingChallenge) {
        Alert.alert(
          'Already Created',
          `You have already created a "${backendType.replace(/_/g, ' ')}" challenge. Each challenge type can only be created once.`
        );
        return;
      }

      const requestPayload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        type: backendType, // ← 使用系统类型而不是 UUID
        duration_days: parseInt(formData.duration),
        target_value: 0,
        badge_icon: '🏆',
      };

      console.log('📤 Creating challenge with payload:', requestPayload);

      const response = await createChallenge(requestPayload);

      console.log('📥 Create challenge response:', response);

      if (response.code === 200 && response.data) {
        // 后端返回的 challenge 数据
        const newChallengeData = response.data;
        const selectedBadge = BADGE_DESIGNS[formData.badge] || BADGE_DESIGNS[0];

        // 构造前端的 CommunityChallenge 对象
        const newChallenge: CommunityChallenge = {
          id: newChallengeData.id,
          userChallengeId: undefined,
          title: newChallengeData.title,
          description: newChallengeData.description,
          icon: newChallengeData.badgeIcon || '🏆',
          duration: `${newChallengeData.durationDays} Days`,
          participants: 0,
          color: formData.color,
          joined: false,
          fullDescription: newChallengeData.description,
          type: newChallengeData.type,
          targetValue: newChallengeData.targetValue,
          badge: {
            name: `${newChallengeData.title} Badge`,
            image: '',
            description: `Complete ${newChallengeData.durationDays} days of ${newChallengeData.title} to earn this badge.`,
            icon: selectedBadge.icon,
            badgeGradient: selectedBadge.gradient,
          },
          topParticipants: [],
        };

        setChallenges([...challenges, newChallenge]);
        setShowCreateChallenge(false);
        resetChallengeForm();

        Alert.alert('Success', `Challenge "${newChallengeData.title}" created! Now join it to start.`);
      } else {
        console.error('❌ Create challenge failed:', response);
        Alert.alert('Error', response.message || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('❌ Failed to create challenge:', error);
      let errorMessage = 'Failed to create challenge';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', error.message);
      }

      Alert.alert('Error', errorMessage);
    }
  };

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
    handleLoadChallenges,
    handleLoadChallengeDetail,
    handleJoinChallenge,
    handleCheckinChallenge,
    handleAbandonChallenge,
    handleLikePost,
    handleAddComment,
    handleDeletePost,
    handleDeleteComment,
    handleFollowUser,
    handleJoinTopic,
    handleLoadFeed,
    handleLoadFollowingFeed,
    handleLoadMyTopics,
    handleCreatePost,
    handleCreateChallenge,
    resetChallengeForm,
  };
};
