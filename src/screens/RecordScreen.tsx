import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import {
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { StreamingAssistantMarkdown } from '../components/common/StreamingAssistantMarkdown'
import { FloatingChatButton } from '../components/common/FloatingChatButton'
import { analyze, analyzeImage as apiAnalyzeImage } from '../api/ai'
import { useAuth } from '../context/AuthContext'
import type { UserNutritionContext } from '../api/types'

// ─── Colors (consistent with HomeScreen) ────────────────────
const COLORS = {
    bg: '#F4F7F2',
    card: '#FFFFFF',
    primary: '#97B08A',
    primaryDark: '#7A9A6D',
    dark: '#1D3557',
    sub: '#7D8A97',
    iconBg: '#E8F0E4',
    shadow: '#000',
    lightGray: '#F8F9FA',
    segmentBg: '#F0F4F8',
}

// ─── Types ───────────────────────────────────────────────────
type RecordMode = 'text' | 'photo'

interface ChatMessage {
    id: string
    text: string
    sender: 'user' | 'assistant'
    timestamp: Date
}

// ─── Mock Data ───────────────────────────────────────────────
const EXAMPLE_DESCRIPTIONS = [
    'Lunch: Caesar salad with grilled chicken breast, olive oil dressing',
    'Dinner: One bowl of brown rice, steamed fish, stir-fried vegetables',
]

// ─── Handlers ────────────────────────────────────────────────

// ─── Chat Modal Component ──────────────────────────────────────────
function ChatModal({
    visible,
    onClose,
    messages,
    inputText,
    onInputChange,
    onSendMessage,
    sending = false,
}: {
    visible: boolean
    onClose: () => void
    messages: ChatMessage[]
    inputText: string
    onInputChange: (text: string) => void
    onSendMessage: () => void
    sending?: boolean
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.chatOverlay}>
                <View style={styles.chatContainer}>
                    {/* Header */}
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle}>AI Chat</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.dark} />
                        </Pressable>
                    </View>

                    {/* Messages */}
                    <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
                        {messages.map((message) => (
                            <View
                                key={message.id}
                                style={[
                                    styles.messageContainer,
                                    message.sender === 'user' ? styles.userMessage : styles.assistantMessage,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        message.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                                    ]}
                                >
                                    {message.sender === 'user' ? (
                                        <Text style={[styles.messageText, styles.userText]}>
                                            {message.text}
                                        </Text>
                                    ) : (
                                        <StreamingAssistantMarkdown
                                            markdown={message.text}
                                            textColor={COLORS.dark}
                                            linkColor={COLORS.primary}
                                        />
                                    )}
                                </View>
                            </View>
                        ))}
                        {sending ? (
                            <View style={[styles.messageContainer, styles.assistantMessage]}>
                                <View
                                    style={[
                                        styles.messageBubble,
                                        styles.assistantBubble,
                                        styles.thinkingBubble,
                                    ]}
                                >
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                    <Text style={[styles.messageText, styles.assistantText, styles.thinkingLabel]}>
                                        Thinking...
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.chatInputArea}>
                        <TextInput
                            style={styles.chatInput}
                            value={inputText}
                            onChangeText={onInputChange}
                            placeholder="Ask about your meals..."
                            placeholderTextColor={COLORS.sub}
                            multiline
                            maxLength={500}
                        />
                        <Pressable
                            style={[
                                styles.sendButton,
                                (!inputText.trim() || sending) && styles.sendButtonDisabled,
                            ]}
                            onPress={onSendMessage}
                            disabled={!inputText.trim() || sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={18}
                                    color={inputText.trim() && !sending ? '#fff' : COLORS.sub}
                                />
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

// ─── Main Component ──────────────────────────────────────────
export function RecordScreen() {
    const { userProfile } = useAuth()
    const [activeMode, setActiveMode] = useState<RecordMode>('text')
    const [textInput, setTextInput] = useState('')

    // Build userContext from profile for AI requests
    const userContext: UserNutritionContext | undefined = userProfile
        ? {
            heightCm: userProfile.height,
            weightKg: userProfile.weight,
            age: userProfile.age,
            gender: userProfile.gender,
            goal: userProfile.goal,
            dailyCalorieTarget: userProfile.dailyCalories,
        }
        : undefined

    // Analysis-related state
    const [analyzing, setAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const [analysisError, setAnalysisError] = useState<string | null>(null)

    // Chat-related state
    const [chatVisible, setChatVisible] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [sendingMessage, setSendingMessage] = useState(false)

    // ─── Photo/Gallery Handlers ─────────────────────
    const handleTakePhoto = async () => {
        try {
            // Request camera permission
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Camera permission is required to take photos')
                return
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })

            if (!result.canceled && result.assets?.[0]?.uri) {
                console.log('Photo taken:', result.assets[0].uri)
                await handleImageAnalysis(result.assets[0].uri)
            }
        } catch (error) {
            console.log('Take photo error:', error)
            Alert.alert('Error', 'Failed to take photo')
        }
    }

    const handleUploadFromGallery = async () => {
        try {
            // Request media library permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Media library permission is required to access photos')
                return
            }

            // Open gallery
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })

            if (!result.canceled && result.assets?.[0]?.uri) {
                console.log('Image selected:', result.assets[0].uri)
                await handleImageAnalysis(result.assets[0].uri)
            }
        } catch (error) {
            console.log('Upload from gallery error:', error)
            Alert.alert('Error', 'Failed to select image from gallery')
        }
    }

    // ─── Chat Handlers ─────────────────────
    const handleChatPress = () => {
        setChatVisible(true)
    }

    const handleCloseChat = () => {
        setChatVisible(false)
    }

    const handleSendMessage = async () => {
        const messageText = chatInput.trim()
        if (!messageText) return

        // Add user message immediately
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'user',
            timestamp: new Date(),
        }
        setChatMessages(prev => [...prev, userMsg])
        setChatInput('')
        setSendingMessage(true)

        try {
            const res = await analyze({ text: messageText, userContext })
            const data = res.data
            let reply: string

            if (!data) {
                reply = 'No response from AI'
            } else if (data.type === 'PROFILE_NEEDED' && data.profilePrompt) {
                reply = data.profilePrompt
            } else if (data.adviceText) {
                reply = data.adviceText
            } else if (data.type === 'FOOD_ANALYSIS' && data.foodAnalysis) {
                const s = data.foodAnalysis.summary
                const foods = data.foodAnalysis.foods?.map(f => f.nameEn || f.nameZh).join(', ') || ''
                reply = `Detected: ${foods}\nCalories: ${s?.totalCalories ?? '-'} kcal | Protein: ${s?.totalProteinG ?? '-'}g | Fat: ${s?.totalFatG ?? '-'}g | Carbs: ${s?.totalCarbsG ?? '-'}g`
            } else {
                reply = res.message || 'No response from AI'
            }
            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: reply,
                sender: 'assistant',
                timestamp: new Date(),
            }
            setChatMessages(prev => [...prev, assistantMsg])
        } catch (error: any) {
            const errMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: `Error: ${error?.message || 'Unknown error'}`,

                sender: 'assistant',
                timestamp: new Date(),
            }
            setChatMessages(prev => [...prev, errMsg])
        } finally {
            setSendingMessage(false)
        }
    }

    // ─── Text Analysis Handler ─────────────────────────
    const handleAnalyzeText = async () => {
        if (!textInput.trim()) {
            Alert.alert('Notice', 'Please enter a food description')
            return
        }
        setAnalyzing(true)
        setAnalysisError(null)
        try {
            const res = await analyze({ text: textInput, userContext })
            const data = res.data
            let displayMessage: string
            if (data?.type === 'PROFILE_NEEDED' && data.profilePrompt) {
                displayMessage = data.profilePrompt
            } else if (data?.adviceText) {
                displayMessage = data.adviceText
            } else if (data?.type === 'FOOD_ANALYSIS' && data.foodAnalysis?.summary) {
                displayMessage = `Total calories: ${data.foodAnalysis.summary.totalCalories ?? '-'} kcal`
            } else {
                displayMessage = res.message || 'Analysis complete'
            }
            setAnalysisResult({
                type: data?.type,
                content: data,
                message: displayMessage,
                inputText: textInput,
            })
        } catch (error: any) {
            const errorMsg = error?.message || 'Network error'
            setAnalysisError(errorMsg)
            Alert.alert('Request Failed', errorMsg)
        } finally {
            setAnalyzing(false)
        }
    }

    // ─── Image Analysis Handler ─────────────────────────
    const handleImageAnalysis = async (imageUri: string) => {
        setAnalyzing(true)
        setAnalysisError(null)
        try {
            // Convert local URI to Blob
            const resp = await fetch(imageUri)
            const blob = await resp.blob()
            const res = await apiAnalyzeImage(blob, 'photo.jpg')
            const data = res.data
            let displayMessage: string
            if (data?.type === 'PROFILE_NEEDED' && data.profilePrompt) {
                displayMessage = data.profilePrompt
            } else if (data?.adviceText) {
                displayMessage = data.adviceText
            } else if (data?.type === 'FOOD_ANALYSIS' && data.foodAnalysis?.summary) {
                displayMessage = `Total calories: ${data.foodAnalysis.summary.totalCalories ?? '-'} kcal`
            } else {
                displayMessage = res.message || 'Image recognition complete'
            }
            setAnalysisResult({
                type: data?.type,
                content: data,
                message: displayMessage,
                imageUri,
            })
        } catch (error: any) {
            const errorMsg = error?.message || 'Image processing failed'
            setAnalysisError(errorMsg)
            Alert.alert('Request Failed', errorMsg)
        } finally {
            setAnalyzing(false)
        }
    }

    // ─── Segmented Control Renderer ─────────────────────────
    const renderSegmentedControl = () => (
        <View style={styles.segmentedOuter}>
            <View style={styles.segmentedContainer}>
                <Pressable
                    style={[
                        styles.segmentButton,
                        activeMode === 'text' && styles.segmentActive,
                    ]}
                    onPress={() => setActiveMode('text')}
                >
                    <MaterialCommunityIcons
                        name="text"
                        size={18}
                        color={activeMode === 'text' ? '#fff' : COLORS.sub}
                        style={styles.segmentIcon}
                    />
                    <Text
                        style={[
                            styles.segmentText,
                            activeMode === 'text' && styles.segmentTextActive,
                        ]}
                    >
                        Text Description
                    </Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.segmentButton,
                        activeMode === 'photo' && styles.segmentActive,
                    ]}
                    onPress={() => setActiveMode('photo')}
                >
                    <Ionicons
                        name="camera"
                        size={18}
                        color={activeMode === 'photo' ? '#fff' : COLORS.sub}
                        style={styles.segmentIcon}
                    />
                    <Text
                        style={[
                            styles.segmentText,
                            activeMode === 'photo' && styles.segmentTextActive,
                        ]}
                    >
                        Photo Scan
                    </Text>
                </Pressable>
            </View>
        </View>
    )

    // ─── Analysis Result Card ─────────────────────────────
    const renderAnalysisResult = () => {
        if (analyzing) {
            return (
                <View style={styles.resultCard}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.resultMessage, { marginTop: 12 }]}>Analyzing...</Text>
                </View>
            )
        }

        if (analysisError) {
            return (
                <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                        <Ionicons name="alert-circle" size={20} color="#E74C3C" />
                        <Text style={[styles.resultTitle, { color: '#E74C3C' }]}>Analysis Failed</Text>
                    </View>
                    <Text style={styles.resultMessage}>{analysisError}</Text>
                    <Pressable style={styles.retryButton} onPress={() => { setAnalysisError(null); setAnalysisResult(null) }}>
                        <Text style={styles.retryButtonText}>Dismiss</Text>
                    </Pressable>
                </View>
            )
        }

        if (!analysisResult) return null

        const data = analysisResult.content
        const isFood = data?.type === 'FOOD_ANALYSIS' && data?.foodAnalysis
        const isProfileNeeded = data?.type === 'PROFILE_NEEDED'

        return (
            <View style={styles.resultCard}>
                {/* Header */}
                <View style={styles.resultHeader}>
                    <Ionicons
                        name={isProfileNeeded ? 'person-circle' : 'checkmark-circle'}
                        size={20}
                        color={isProfileNeeded ? '#F39C12' : COLORS.primary}
                    />
                    <Text style={styles.resultTitle}>
                        {isProfileNeeded ? 'Profile Incomplete' : 'Analysis Result'}
                    </Text>
                </View>

                {/* Photo preview */}
                {analysisResult.imageUri && (
                    <Image
                        source={{ uri: analysisResult.imageUri }}
                        style={styles.resultImage}
                        resizeMode="cover"
                    />
                )}

                {/* Profile needed */}
                {isProfileNeeded && (
                    <Text style={styles.resultMessage}>{data.profilePrompt}</Text>
                )}

                {/* Advice / Chat text */}
                {!isFood && !isProfileNeeded && data?.adviceText && (
                    <Text style={styles.resultMessage}>{data.adviceText}</Text>
                )}

                {/* Food analysis details */}
                {isFood && (
                    <>
                        {/* Meal summary bar */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{Math.round(data.foodAnalysis.summary?.totalCalories ?? 0)}</Text>
                                <Text style={styles.summaryLabel}>kcal</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{Math.round(data.foodAnalysis.summary?.totalProteinG ?? 0)}g</Text>
                                <Text style={styles.summaryLabel}>Protein</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{Math.round(data.foodAnalysis.summary?.totalFatG ?? 0)}g</Text>
                                <Text style={styles.summaryLabel}>Fat</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{Math.round(data.foodAnalysis.summary?.totalCarbsG ?? 0)}g</Text>
                                <Text style={styles.summaryLabel}>Carbs</Text>
                            </View>
                        </View>

                        {/* Food items list */}
                        {data.foodAnalysis.foods?.map((food: any, idx: number) => (
                            <View key={idx} style={styles.foodItem}>
                                <View style={styles.foodNameRow}>
                                    <Text style={styles.foodName}>
                                        {food.nameEn || food.nameZh}
                                    </Text>
                                    <Text style={styles.foodCalories}>{Math.round(food.calories ?? 0)} kcal</Text>
                                </View>
                                <Text style={styles.foodPortion}>
                                    {food.portionAmount}{food.portionUnit}
                                    {food.dataSource ? ` · ${food.dataSource}` : ''}
                                </Text>
                                <View style={styles.foodMacros}>
                                    <Text style={styles.macroText}>P {Math.round(food.proteinG ?? 0)}g</Text>
                                    <Text style={styles.macroText}>F {Math.round(food.fatG ?? 0)}g</Text>
                                    <Text style={styles.macroText}>C {Math.round(food.carbsG ?? 0)}g</Text>
                                </View>
                                {food.flagged && (
                                    <View style={styles.flagRow}>
                                        <Ionicons name="warning" size={14} color="#F39C12" />
                                        <Text style={styles.flagText}>{food.flagReason}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </>
                )}

                {/* Dismiss button */}
                <Pressable style={styles.retryButton} onPress={() => { setAnalysisResult(null); setAnalysisError(null) }}>
                    <Text style={styles.retryButtonText}>Done</Text>
                </Pressable>
            </View>
        )
    }

    // ─── Text Mode Content ───────────────────────────────────
    const renderTextMode = () => (
        <>
            {/* AI Smart Analysis Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                        name="auto-fix"
                        size={20}
                        color={COLORS.primary}
                        style={styles.cardIcon}
                    />
                    <Text style={styles.cardTitle}>AI Smart Analysis</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Describe what you ate and AI will automatically calculate the
                    nutritional content and calories
                </Text>

                <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={5}
                    placeholder="e.g., Had two boiled eggs, a slice of whole wheat toast, and black coffee"
                    placeholderTextColor={COLORS.sub}
                    value={textInput}
                    onChangeText={setTextInput}
                    textAlignVertical="top"
                />

                <Pressable
                    style={({ pressed }) => [
                        styles.analyzeButton,
                        pressed && styles.analyzeButtonPressed,
                        analyzing && styles.analyzeButtonDisabled,
                    ]}
                    onPress={handleAnalyzeText}
                    disabled={analyzing || !textInput.trim()}
                >
                    {analyzing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                    )}
                    <Text style={styles.analyzeButtonText}>
                        {analyzing ? 'Analyzing...' : 'Analyze Now'}
                    </Text>
                </Pressable>
            </View>

            {/* Analysis Result */}
            {activeMode === 'text' && renderAnalysisResult()}

            {/* Example Descriptions */}
            <Text style={styles.exampleTitle}>Example descriptions:</Text>

            {EXAMPLE_DESCRIPTIONS.map((example, index) => (
                <View key={index} style={styles.exampleCard}>
                    <Text style={styles.exampleText}>{example}</Text>
                </View>
            ))}
        </>
    )

    // ─── Photo Mode Content ─────────────────────────────────
    const renderPhotoMode = () => (
        <>
            {/* Photo Recognition Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                        name="auto-fix"
                        size={20}
                        color={COLORS.primary}
                        style={styles.cardIcon}
                    />
                    <Text style={styles.cardTitle}>Photo Recognition</Text>
                </View>
                <Text style={styles.cardDescription}>
                    Take or upload a photo of your food, and AI will automatically
                    identify and analyze the nutritional content
                </Text>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryButton,
                            pressed && styles.primaryButtonPressed,
                        ]}
                        onPress={handleTakePhoto}
                    >
                        <Ionicons name="camera" size={20} color="#fff" />
                        <Text style={styles.primaryButtonText}>Take Photo</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.secondaryButton,
                            pressed && styles.secondaryButtonPressed,
                        ]}
                        onPress={handleUploadFromGallery}
                    >
                        <Ionicons name="image" size={20} color={COLORS.dark} />
                        <Text style={styles.secondaryButtonText}>
                            Upload from Gallery
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Photo Analysis Result */}
            {activeMode === 'photo' && renderAnalysisResult()}

            {/* Recording Tips Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons
                        name="bulb"
                        size={20}
                        color={COLORS.primary}
                        style={styles.cardIcon}
                    />
                    <Text style={styles.cardTitle}>Recording Tips</Text>
                </View>

                <View style={styles.tipsList}>
                    <View style={styles.tipItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.tipText}>
                            Include food type and approximate portion size in your description
                        </Text>
                    </View>
                    <View style={styles.tipItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.tipText}>
                            Mention cooking method (steamed, boiled, fried, etc.)
                        </Text>
                    </View>
                    <View style={styles.tipItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.tipText}>
                            Ensure good lighting when taking photos for better accuracy
                        </Text>
                    </View>
                </View>
            </View>
        </>
    )

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with white background */}
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>FoodPrint</Text>
                </View>

                {/* Segmented Control */}
                <View style={{ paddingHorizontal: 16 }}>
                    {renderSegmentedControl()}
                </View>

                {/* Content based on active mode */}
                <View style={{ paddingHorizontal: 16 }}>
                    {activeMode === 'text' ? renderTextMode() : renderPhotoMode()}
                </View>

                {/* Bottom spacer for FAB */}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Floating Chat Button */}
            <FloatingChatButton onPress={handleChatPress} />

            {/* Chat Modal */}
            <ChatModal
                visible={chatVisible}
                onClose={handleCloseChat}
                messages={chatMessages}
                inputText={chatInput}
                onInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                sending={sendingMessage}
            />
        </SafeAreaView>
    )
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    // ── Layout ──
    safe: {
        backgroundColor: COLORS.bg,
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 0,
        paddingTop: 0,
    },

    // ── Header ──
    headerContainer: {
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
        marginBottom: 20,
    },
    header: {
        color: COLORS.dark,
        fontSize: 28,
        fontWeight: '800',
    },

    // ── Segmented Control ──
    segmentedOuter: {
        marginBottom: 24,
    },
    segmentedContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        elevation: 1,
        flexDirection: 'row',
        padding: 3,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    segmentButton: {
        alignItems: 'center',
        borderRadius: 12,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    segmentActive: {
        backgroundColor: COLORS.primary,
    },
    segmentIcon: {
        marginRight: 6,
    },
    segmentText: {
        color: COLORS.sub,
        fontSize: 14,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#fff',
    },

    // ── Cards ──
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        elevation: 2,
        marginBottom: 20,
        padding: 24,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 12,
    },
    cardIcon: {
        marginRight: 8,
    },
    cardTitle: {
        color: COLORS.dark,
        fontSize: 18,
        fontWeight: '700',
    },
    cardDescription: {
        color: COLORS.sub,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },

    // ── Text Input ──
    textInput: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        color: COLORS.dark,
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 20,
        minHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    analyzeButton: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingVertical: 16,
    },
    analyzeButtonPressed: {
        backgroundColor: COLORS.primaryDark,
    },
    analyzeButtonDisabled: {
        backgroundColor: COLORS.sub,
        opacity: 0.6,
    },
    analyzeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // ── Example Descriptions ──
    exampleTitle: {
        color: COLORS.sub,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    exampleCard: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    exampleText: {
        color: COLORS.sub,
        fontSize: 13,
        lineHeight: 18,
    },

    // ── Photo Mode Buttons ──
    buttonContainer: {
        gap: 12,
    },
    primaryButton: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingVertical: 16,
    },
    primaryButtonPressed: {
        backgroundColor: COLORS.primaryDark,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        alignItems: 'center',
        backgroundColor: COLORS.lightGray,
        borderRadius: 14,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingVertical: 16,
    },
    secondaryButtonPressed: {
        backgroundColor: '#E9ECEF',
    },
    secondaryButtonText: {
        color: COLORS.dark,
        fontSize: 16,
        fontWeight: '600',
    },

    // ── Tips ──
    tipsList: {
        gap: 12,
    },
    tipItem: {
        alignItems: 'flex-start',
        flexDirection: 'row',
    },
    bullet: {
        backgroundColor: COLORS.primary,
        borderRadius: 3,
        height: 6,
        marginRight: 12,
        marginTop: 6,
        width: 6,
    },
    tipText: {
        color: COLORS.sub,
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },

    // ── Chat Modal Styles ──
    chatOverlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    chatContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        maxHeight: '80%',
        width: '100%',
    },
    chatHeader: {
        alignItems: 'center',
        borderBottomColor: '#F0F0F0',
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    chatTitle: {
        color: COLORS.dark,
        fontSize: 18,
        fontWeight: '700',
    },
    chatMessages: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    messageContainer: {
        marginBottom: 12,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    assistantMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        borderRadius: 16,
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
    },
    assistantBubble: {
        backgroundColor: '#F5F5F5',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
    },
    assistantText: {
        color: COLORS.dark,
    },
    thinkingBubble: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        minWidth: 120,
    },
    thinkingLabel: {
        fontSize: 14,
        opacity: 0.85,
    },
    chatInputArea: {
        alignItems: 'flex-end',
        borderTopColor: '#F0F0F0',
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    chatInput: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        color: COLORS.dark,
        flex: 1,
        fontSize: 14,
        maxHeight: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sendButton: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        height: 36,
        justifyContent: 'center',
        width: 36,
    },
    sendButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },

    // ── Analysis Result Card ──
    resultCard: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        elevation: 2,
        marginBottom: 20,
        padding: 24,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    resultHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    resultTitle: {
        color: COLORS.dark,
        fontSize: 18,
        fontWeight: '700',
    },
    resultMessage: {
        color: COLORS.sub,
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 12,
    },
    resultImage: {
        borderRadius: 12,
        height: 180,
        marginBottom: 16,
        width: '100%',
    },
    retryButton: {
        alignItems: 'center',
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        marginTop: 8,
        paddingVertical: 12,
    },
    retryButtonText: {
        color: COLORS.dark,
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Meal Summary Row ──
    summaryRow: {
        backgroundColor: COLORS.iconBg,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 14,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        color: COLORS.dark,
        fontSize: 18,
        fontWeight: '700',
    },
    summaryLabel: {
        color: COLORS.sub,
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    summaryDivider: {
        backgroundColor: COLORS.primary,
        opacity: 0.3,
        width: 1,
    },

    // ── Food Item ──
    foodItem: {
        borderBottomColor: '#F0F0F0',
        borderBottomWidth: 1,
        marginBottom: 12,
        paddingBottom: 12,
    },
    foodNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    foodName: {
        color: COLORS.dark,
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    foodCalories: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    foodPortion: {
        color: COLORS.sub,
        fontSize: 12,
        marginBottom: 6,
    },
    foodMacros: {
        flexDirection: 'row',
        gap: 12,
    },
    macroText: {
        color: COLORS.sub,
        fontSize: 12,
        fontWeight: '500',
    },
    flagRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
        marginTop: 6,
    },
    flagText: {
        color: '#F39C12',
        fontSize: 12,
    },
})
