import {
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    SafeAreaView,
} from 'react-native'
import React from 'react'
import type { CommunityChallenge } from '../types'
import { useCommunityStyles } from '../hooks'

interface ChallengeDetailModalProps {
    visible: boolean
    challenge: CommunityChallenge | null
    onClose: () => void
    onJoinPress: (id: string) => void
}

export function ChallengeDetailModal({
    visible,
    challenge,
    onClose,
    onJoinPress,
}: ChallengeDetailModalProps) {
    const styles = useCommunityStyles()

    if (!challenge) return null

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
                <ScrollView style={[styles.container, { paddingTop: 0 }]}>
                    <View
                        style={[
                            styles.challengeHeaderCard,
                            { backgroundColor: challenge.color },
                        ]}
                    >
                        <View style={styles.headerContent}>
                            <Text style={styles.headerIcon}>{challenge.icon}</Text>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle}>
                                    {challenge.title}
                                </Text>
                                <View style={styles.headerMeta}>
                                    <Text style={styles.headerMetaText}>
                                        📅 {challenge.duration}
                                    </Text>
                                    <Text style={styles.headerMetaText}>
                                        👥 {challenge.participants}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButtonTop}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>About This Challenge</Text>
                        <Text style={styles.aboutDescription}>
                            {challenge.fullDescription}
                        </Text>
                    </View>

                    <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Reward Badge</Text>
                        <View
                            style={[
                                styles.badgeCard,
                                { backgroundColor: challenge.badge.badgeGradient },
                            ]}
                        >
                            <Text style={styles.badgeIcon}>
                                {challenge.badge.icon}
                            </Text>
                            <Text style={styles.badgeName}>{challenge.badge.name}</Text>
                            <Text style={styles.badgeDescription}>
                                {challenge.badge.description}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Top Participants</Text>
                        {challenge.topParticipants.map((participant, index) => (
                            <View key={index} style={styles.participantItem}>
                                <Image
                                    source={{ uri: participant.avatar }}
                                    style={styles.participantAvatar}
                                />
                                <View style={styles.participantInfo}>
                                    <Text style={styles.participantName}>
                                        {participant.name}
                                    </Text>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${participant.progress}%` },
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.progressText}>{participant.progress}%</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.joinChallengeButton,
                            challenge.joined && styles.joinedButton,
                        ]}
                        onPress={() => onJoinPress(challenge.id)}
                    >
                        <Text style={styles.joinChallengeButtonText}>
                            {challenge.joined ? '✓ Joined Challenge' : 'Join Challenge'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    )
}
