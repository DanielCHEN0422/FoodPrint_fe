import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { CommunityChallenge } from '../types'

interface ChallengeCardProps {
    challenge: CommunityChallenge
    onPress: (challenge: CommunityChallenge) => void
    onJoinPress: (challengeId: string) => void
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    onPress,
    onJoinPress,
}) => {
    return (
        <TouchableOpacity
            onPress={() => onPress(challenge)}
            style={[styles.card, { backgroundColor: challenge.color }]}
        >
            <View style={styles.header}>
                <Text style={styles.icon}>{challenge.icon}</Text>
                <View style={styles.info}>
                    <Text style={styles.title}>{challenge.title}</Text>
                    <Text style={styles.status}>{challenge.duration}</Text>
                    {challenge.streak && (
                        <Text style={styles.streak}>🔥 {challenge.streak} day streak</Text>
                    )}
                </View>
            </View>
            <Text style={styles.description}>{challenge.description}</Text>
            <View style={styles.footer}>
                <Text style={styles.participants}>{challenge.participants} participants</Text>
                <TouchableOpacity
                    onPress={(e: any) => {
                        e.stopPropagation()
                        onJoinPress(challenge.id)
                    }}
                    style={[styles.joinButton, challenge.joined && styles.joinedButton]}
                >
                    <Text style={styles.joinText}>{challenge.joined ? '✓ Joined' : 'Join'}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 8,
        marginBottom: 12,
        borderRadius: 20,
        padding: 16,
        width: 280,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    icon: {
        fontSize: 32,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    status: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    streak: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
        marginTop: 4,
    },
    description: {
        fontSize: 14,
        color: '#FFF',
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    participants: {
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
    joinedButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    joinText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
})
