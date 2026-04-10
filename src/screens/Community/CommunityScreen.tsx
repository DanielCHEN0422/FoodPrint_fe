import { StatusBar } from 'expo-status-bar'
import {
    Text,
    View,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    TextInput,
    SafeAreaView,
} from 'react-native'
import React, { useState } from 'react'

// Import from modularized structure
import { useCommunityState, useCommunityStyles } from './hooks'
import { ChallengeCard, PostCard } from './components'
import {
    CHALLENGE_TYPES,
    DURATION_OPTIONS,
    BADGE_DESIGNS,
    EMOJI_CATEGORIES,
    MEAL_CATEGORIES,
} from './constants'

export function CommunityScreen() {
    const [isPremium] = useState(true)
    const communityStyles = useCommunityStyles()
    const {
        flatListRef,
        challenges,
        selectedChallenge,
        showChallengeDetail,
        showCreateChallenge,
        posts,
        showCreatePost,
        scrollOffset,
        createStep,
        formData,
        titleError,
        descError,
        setSelectedChallenge,
        setShowChallengeDetail,
        setShowCreateChallenge,
        setShowCreatePost,
        setCreateStep,
        setFormData,
        setTitleError,
        setDescError,
        scroll,
        handleScroll,
        handleJoinChallenge,
        handleLikePost,
        handleCreatePost,
        handleCreateChallenge,
        resetChallengeForm,
    } = useCommunityState()

    const [postText, setPostText] = useState('')
    const [selectedImage, setSelectedImage] = useState('')
    const [showImagePicker, setShowImagePicker] = useState(false)

    const handleTypeSelect = (type: any) => {
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

    const handleEmojiInsert = (emoji: string) => {
        setPostText(postText + emoji)
    }

    const handleCreatePostSubmit = () => {
        if (postText.trim()) {
            handleCreatePost({
                text: postText,
                image: selectedImage,
            })
            setPostText('')
            setSelectedImage('')
            setShowImagePicker(false)
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: communityStyles.container.backgroundColor }}>
            <ScrollView style={communityStyles.container} showsVerticalScrollIndicator={false}>
            <View style={communityStyles.header}>
                <Text style={communityStyles.title}>FoodPrint</Text>
            </View>

            {/* Community Challenges Section */}
            <View style={communityStyles.section}>
                <View style={communityStyles.sectionHeader}>
                    <Text style={communityStyles.sectionTitle}>Community Challenges</Text>
                    <View style={communityStyles.buttonGroup}>
                        {isPremium && (
                            <TouchableOpacity
                                style={communityStyles.addButton}
                                onPress={() => setShowCreateChallenge(true)}
                            >
                                <Text style={communityStyles.addButtonText}>+</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={communityStyles.scrollButton}
                            onPress={() => scroll('left')}
                        >
                            <Text style={communityStyles.scrollButtonText}>‹</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={communityStyles.scrollButton}
                            onPress={() => scroll('right')}
                        >
                            <Text style={communityStyles.scrollButtonText}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <FlatList
                    ref={flatListRef}
                    data={challenges}
                    renderItem={({ item }) => (
                        <ChallengeCard
                            challenge={item}
                            onPress={(challenge) => {
                                setSelectedChallenge(challenge)
                                setShowChallengeDetail(true)
                            }}
                            onJoinPress={(id) => handleJoinChallenge(id)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    contentContainerStyle={communityStyles.challengeListContent}
                    onScroll={handleScroll}
                />
            </View>

            {/* Community Feed Section */}
            <View style={communityStyles.section}>
                <View style={communityStyles.sectionHeader}>
                    <Text style={communityStyles.sectionTitle}>Community Feed</Text>
                    <TouchableOpacity
                        style={communityStyles.postButton}
                        onPress={() => setShowCreatePost(true)}
                    >
                        <Text style={communityStyles.postButtonIcon}>✎</Text>
                        <Text style={communityStyles.postButtonText}>Share</Text>
                    </TouchableOpacity>
                </View>
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} onLikePress={handleLikePost} />
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
                    <SafeAreaView style={{ flex: 1, backgroundColor: communityStyles.container.backgroundColor }}>
                        <ScrollView style={[communityStyles.container, { paddingTop: 0 }]}>
                        <View
                            style={[
                                communityStyles.challengeHeaderCard,
                                { backgroundColor: selectedChallenge.color },
                            ]}
                        >
                            <View style={communityStyles.headerContent}>
                                <Text style={communityStyles.headerIcon}>{selectedChallenge.icon}</Text>
                                <View style={communityStyles.headerInfo}>
                                    <Text style={communityStyles.headerTitle}>
                                        {selectedChallenge.title}
                                    </Text>
                                    <View style={communityStyles.headerMeta}>
                                        <Text style={communityStyles.headerMetaText}>
                                            📅 {selectedChallenge.duration}
                                        </Text>
                                        <Text style={communityStyles.headerMetaText}>
                                            👥 {selectedChallenge.participants}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={communityStyles.closeButtonTop}
                                onPress={() => setShowChallengeDetail(false)}
                            >
                                <Text style={communityStyles.closeButtonIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={communityStyles.detailSection}>
                            <Text style={communityStyles.detailSectionTitle}>About This Challenge</Text>
                            <Text style={communityStyles.aboutDescription}>
                                {selectedChallenge.fullDescription}
                            </Text>
                        </View>

                        <View style={communityStyles.detailSection}>
                            <Text style={communityStyles.detailSectionTitle}>Reward Badge</Text>
                            <View
                                style={[
                                    communityStyles.badgeCard,
                                    { backgroundColor: selectedChallenge.badge.badgeGradient },
                                ]}
                            >
                                <Text style={communityStyles.badgeIcon}>
                                    {selectedChallenge.badge.icon}
                                </Text>
                                <Text style={communityStyles.badgeName}>{selectedChallenge.badge.name}</Text>
                                <Text style={communityStyles.badgeDescription}>
                                    {selectedChallenge.badge.description}
                                </Text>
                            </View>
                        </View>

                        <View style={communityStyles.detailSection}>
                            <Text style={communityStyles.detailSectionTitle}>Top Participants</Text>
                            {selectedChallenge.topParticipants.map((participant, index) => (
                                <View key={index} style={communityStyles.participantItem}>
                                    <Image
                                        source={{ uri: participant.avatar }}
                                        style={communityStyles.participantAvatar}
                                    />
                                    <View style={communityStyles.participantInfo}>
                                        <Text style={communityStyles.participantName}>
                                            {participant.name}
                                        </Text>
                                        <View style={communityStyles.progressBar}>
                                            <View
                                                style={[
                                                    communityStyles.progressFill,
                                                    { width: `${participant.progress}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                    <Text style={communityStyles.progressText}>{participant.progress}%</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[
                                communityStyles.joinChallengeButton,
                                selectedChallenge.joined && communityStyles.joinedButton,
                            ]}
                            onPress={() => handleJoinChallenge(selectedChallenge.id)}
                        >
                            <Text style={communityStyles.joinChallengeButtonText}>
                                {selectedChallenge.joined ? '✓ Joined Challenge' : 'Join Challenge'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                    </SafeAreaView>
                </Modal>
            )}

            {/* Create Challenge Modal - 4步向导 */}
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
                    <SafeAreaView style={{ flex: 1, backgroundColor: communityStyles.container.backgroundColor }}>
                        <ScrollView style={communityStyles.container} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={communityStyles.challengeModalHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowCreateChallenge(false)
                                    resetChallengeForm()
                                }}
                            >
                                <Text style={communityStyles.challengeModalCloseText}>✕</Text>
                            </TouchableOpacity>
                            <View style={communityStyles.challengeModalTitleContainer}>
                                <Text style={communityStyles.challengeModalIcon}>✨</Text>
                                <View>
                                    <Text style={communityStyles.challengeModalTitle}>Create Challenge</Text>
                                    <Text style={communityStyles.challengeModalSubtitle}>Premium Feature</Text>
                                </View>
                            </View>
                        </View>

                        {/* Progress bar */}
                        <View style={communityStyles.progressBarContainer}>
                            {[1, 2, 3, 4].map((step) => (
                                <View
                                    key={step}
                                    style={[
                                        communityStyles.progressBarSegment,
                                        step <= createStep && communityStyles.progressBarSegmentActive,
                                    ]}
                                />
                            ))}
                        </View>

                        <View style={communityStyles.createChallengeContent}>
                            {/* Step 1 */}
                            {createStep === 1 && (
                                <View style={communityStyles.stepContainer}>
                                    <Text style={communityStyles.stepTitle}>Choose Challenge Type</Text>
                                    <Text style={communityStyles.stepSubtitle}>
                                        Select the category that best fits your goal
                                    </Text>
                                    <View style={communityStyles.typeCardsContainer}>
                                        {CHALLENGE_TYPES.map((type) => (
                                            <TouchableOpacity
                                                key={type.id}
                                                onPress={() => handleTypeSelect(type)}
                                                style={communityStyles.typeCard}
                                            >
                                                <View
                                                    style={[
                                                        communityStyles.typeCardIcon,
                                                        { backgroundColor: type.color },
                                                    ]}
                                                >
                                                    <Text style={communityStyles.typeCardIconText}>
                                                        {type.icon}
                                                    </Text>
                                                </View>
                                                <View style={communityStyles.typeCardContent}>
                                                    <Text style={communityStyles.typeCardName}>
                                                        {type.name}
                                                    </Text>
                                                    <Text style={communityStyles.typeCardDesc}>
                                                        {type.description}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Step 2 */}
                            {createStep === 2 && (
                                <View style={communityStyles.stepContainer}>
                                    <TouchableOpacity
                                        onPress={() => setCreateStep(1)}
                                        style={communityStyles.backButton}
                                    >
                                        <Text style={communityStyles.backButtonText}>← Back to types</Text>
                                    </TouchableOpacity>

                                    <Text style={communityStyles.stepTitle}>Challenge Details</Text>
                                    <Text style={communityStyles.stepSubtitle}>
                                        Give your challenge a catchy name
                                    </Text>

                                    <View style={communityStyles.formGroup}>
                                        <Text style={communityStyles.formLabelChallenge}>
                                            Challenge Title <Text style={communityStyles.requiredMark}>*</Text>
                                        </Text>
                                        <TextInput
                                            value={formData.title}
                                            onChangeText={handleTitleChange}
                                            placeholder="e.g., Green Smoothie Week"
                                            placeholderTextColor="#999"
                                            maxLength={50}
                                            style={communityStyles.textInputField}
                                        />
                                        <View style={communityStyles.formHint}>
                                            {titleError ? (
                                                <Text style={communityStyles.errorText}>{titleError}</Text>
                                            ) : (
                                                <Text style={communityStyles.hintText}>
                                                    Make it clear and motivating
                                                </Text>
                                            )}
                                            <Text style={communityStyles.charCountChallenge}>
                                                {formData.title.length}/50
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={communityStyles.formGroup}>
                                        <Text style={communityStyles.formLabelChallenge}>
                                            Description <Text style={communityStyles.requiredMark}>*</Text>
                                        </Text>
                                        <TextInput
                                            value={formData.description}
                                            onChangeText={handleDescChange}
                                            placeholder="Describe what participants need to do..."
                                            placeholderTextColor="#999"
                                            maxLength={120}
                                            multiline
                                            numberOfLines={3}
                                            style={[communityStyles.textInputField, { height: 80 }]}
                                        />
                                        <View style={communityStyles.formHint}>
                                            {descError ? (
                                                <Text style={communityStyles.errorText}>{descError}</Text>
                                            ) : (
                                                <Text style={communityStyles.hintText}>
                                                    Keep it concise and clear
                                                </Text>
                                            )}
                                            <Text style={communityStyles.charCountChallenge}>
                                                {formData.description.length}/120
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setCreateStep(3)}
                                        disabled={
                                            !formData.title ||
                                            !formData.description ||
                                            !!titleError ||
                                            !!descError
                                        }
                                        style={[
                                            communityStyles.continueButton,
                                            (!formData.title || !formData.description) &&
                                                communityStyles.continueButtonDisabled,
                                        ]}
                                    >
                                        <Text style={communityStyles.continueButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Step 3 */}
                            {createStep === 3 && (
                                <View style={communityStyles.stepContainer}>
                                    <TouchableOpacity
                                        onPress={() => setCreateStep(2)}
                                        style={communityStyles.backButton}
                                    >
                                        <Text style={communityStyles.backButtonText}>← Back</Text>
                                    </TouchableOpacity>

                                    <Text style={communityStyles.stepTitle}>Challenge Duration</Text>
                                    <Text style={communityStyles.stepSubtitle}>
                                        How long will this challenge last?
                                    </Text>

                                    <View style={communityStyles.durationGrid}>
                                        {DURATION_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                onPress={() =>
                                                    setFormData({ ...formData, duration: option.value })
                                                }
                                                style={[
                                                    communityStyles.durationCard,
                                                    formData.duration === option.value &&
                                                        communityStyles.durationCardSelected,
                                                ]}
                                            >
                                                <Text style={communityStyles.durationLabel}>
                                                    {option.label}
                                                </Text>
                                                <Text style={communityStyles.durationDesc}>
                                                    {option.description}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setCreateStep(4)}
                                        disabled={!formData.duration}
                                        style={[
                                            communityStyles.continueButton,
                                            !formData.duration && communityStyles.continueButtonDisabled,
                                        ]}
                                    >
                                        <Text style={communityStyles.continueButtonText}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Step 4 */}
                            {createStep === 4 && (
                                <View style={communityStyles.stepContainer}>
                                    <TouchableOpacity
                                        onPress={() => setCreateStep(3)}
                                        style={communityStyles.backButton}
                                    >
                                        <Text style={communityStyles.backButtonText}>← Back</Text>
                                    </TouchableOpacity>

                                    <Text style={communityStyles.stepTitle}>Reward Badge</Text>
                                    <Text style={communityStyles.stepSubtitle}>
                                        Choose a badge design for participants
                                    </Text>

                                    <View style={communityStyles.badgeGrid}>
                                        {BADGE_DESIGNS.map((badge, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => setFormData({ ...formData, badge: index })}
                                                style={[
                                                    communityStyles.badgeOption,
                                                    formData.badge === index &&
                                                        communityStyles.badgeOptionSelected,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        communityStyles.badgeCircle,
                                                        { backgroundColor: badge.gradient },
                                                    ]}
                                                >
                                                    <Text style={communityStyles.badgeEmoji}>
                                                        {badge.icon}
                                                    </Text>
                                                </View>
                                                <Text style={communityStyles.badgeNameChallenge}>
                                                    {badge.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={communityStyles.previewContainer}>
                                        <Text style={communityStyles.previewTitle}>🏆 Preview</Text>
                                        <View
                                            style={[
                                                communityStyles.previewCard,
                                                { backgroundColor: formData.color },
                                            ]}
                                        >
                                            <View style={communityStyles.previewHeader}>
                                                <Text style={communityStyles.previewIcon}>
                                                    {formData.selectedTypeData?.icon}
                                                </Text>
                                                <View>
                                                    <Text style={communityStyles.previewTitle2}>
                                                        {formData.title || 'Your Challenge'}
                                                    </Text>
                                                    <Text style={communityStyles.previewDuration}>
                                                        {formData.duration} Days
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={communityStyles.previewDesc}>
                                                {formData.description || 'Your description here...'}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() =>
                                            handleCreateChallenge(formData.selectedTypeData)
                                        }
                                        style={communityStyles.createChallengeButton}
                                    >
                                        <Text style={communityStyles.createChallengeButtonText}>
                                            Create Challenge
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    </SafeAreaView>
                </Modal>
            )}

            {/* Create Post Modal */}
            <Modal visible={showCreatePost} animationType="slide" transparent>
                <SafeAreaView style={{ flex: 1, backgroundColor: communityStyles.container.backgroundColor }}>
                    <View style={[communityStyles.container, { paddingTop: 0 }]}>
                    {/* Header */}
                    <View style={communityStyles.createPostHeader}>
                        <Text style={communityStyles.createPostTitle}>Create Post</Text>
                        <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                            <Text style={communityStyles.closeCreatePostButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
                        {/* Text Input */}
                        <TextInput
                            style={communityStyles.createPostInputField}
                            placeholder="What's on your plate today? Share your meal, achievement, or health tip... 💪"
                            placeholderTextColor="#999"
                            multiline
                            value={postText}
                            onChangeText={setPostText}
                            maxLength={500}
                        />
                        <Text style={communityStyles.charCounterText}>
                            {postText.length}/500
                        </Text>

                        {/* Selected Image Preview */}
                        {selectedImage && (
                            <View style={communityStyles.imagePreviewSection}>
                                <Image source={{ uri: selectedImage }} style={communityStyles.previewImage} />
                                <TouchableOpacity
                                    style={communityStyles.deleteImageButton}
                                    onPress={() => setSelectedImage('')}
                                >
                                    <Text style={communityStyles.deleteImageButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Image Picker Button */}
                        {!selectedImage && (
                            <TouchableOpacity
                                style={communityStyles.imagePickerButtonContainer}
                                onPress={() => setShowImagePicker(!showImagePicker)}
                            >
                                <Text style={communityStyles.imagePickerButtonText}>
                                    📷 Add a photo to your post
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Meal Categories Grid */}
                        {showImagePicker && !selectedImage && (
                            <View>
                                <Text style={communityStyles.mealCategoryTitle}>Choose a meal photo</Text>
                                <View style={communityStyles.mealGrid}>
                                    {MEAL_CATEGORIES.map((meal, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={communityStyles.mealOption}
                                            onPress={() => {
                                                setSelectedImage(
                                                    `https://via.placeholder.com/300?text=${meal.label}`
                                                )
                                                setShowImagePicker(false)
                                            }}
                                        >
                                            <Text style={communityStyles.mealEmoji}>{meal.emoji}</Text>
                                            <Text style={communityStyles.mealLabel}>{meal.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Quick Emojis */}
                        <View style={communityStyles.emojiContainer}>
                            {EMOJI_CATEGORIES.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={communityStyles.emojiButton}
                                    onPress={() => handleEmojiInsert(emoji)}
                                >
                                    <Text style={communityStyles.emojiText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={communityStyles.createPostActionsContainer}>
                            <TouchableOpacity
                                style={communityStyles.cancelButtonStyle}
                                onPress={() => setShowCreatePost(false)}
                            >
                                <Text style={communityStyles.cancelButtonTextStyle}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    communityStyles.postCreateButton,
                                    !postText.trim() && communityStyles.postCreateButtonDisabled,
                                ]}
                                disabled={!postText.trim()}
                                onPress={handleCreatePostSubmit}
                            >
                                <Text style={communityStyles.postCreateButtonText}>Post ✓</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
                </SafeAreaView>
            </Modal>

            <StatusBar style="auto" />
        </ScrollView>
        </SafeAreaView>
    )
}
