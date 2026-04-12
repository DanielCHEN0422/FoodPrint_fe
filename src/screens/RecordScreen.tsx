import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { FloatingChatButton } from '../components/common/FloatingChatButton'

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

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
    {
        id: '1',
        text: "Hi! I'm your FoodPrint assistant. How can I help with your meals today?",
        sender: 'assistant',
        timestamp: new Date(),
    },
]

// ─── Handlers ────────────────────────────────────────────────
const handleAnalyzeText = () => {
    console.log('Analyze Text')
}

// ─── Chat Modal Component ──────────────────────────────────────────
function ChatModal({
    visible,
    onClose,
    messages,
    inputText,
    onInputChange,
    onSendMessage,
}: {
    visible: boolean
    onClose: () => void
    messages: ChatMessage[]
    inputText: string
    onInputChange: (text: string) => void
    onSendMessage: () => void
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
                                    <Text
                                        style={[
                                            styles.messageText,
                                            message.sender === 'user' ? styles.userText : styles.assistantText,
                                        ]}
                                    >
                                        {message.text}
                                    </Text>
                                </View>
                            </View>
                        ))}
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
                                !inputText.trim() && styles.sendButtonDisabled,
                            ]}
                            onPress={onSendMessage}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons
                                name="send"
                                size={18}
                                color={inputText.trim() ? '#fff' : COLORS.sub}
                            />
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

// ─── Main Component ──────────────────────────────────────────
export function RecordScreen() {
    const [activeMode, setActiveMode] = useState<RecordMode>('text')
    const [textInput, setTextInput] = useState('')
    
    // Chat-related state - FloatingChatButton 同步接入
    const [chatVisible, setChatVisible] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES)
    
    // ─── Photo/Gallery Handlers - 接入手机能力 ─────────────────────
    const handleTakePhoto = async () => {
        try {
            // 请求相机权限
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Camera permission is required to take photos')
                return
            }
            
            // 打开相机
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })
            
            if (!result.canceled && result.assets?.[0]?.uri) {
                console.log('Photo taken:', result.assets[0].uri)
                Alert.alert('Photo taken', `Image URI: ${result.assets[0].uri}`)
            }
        } catch (error) {
            console.log('Take photo error:', error)
            Alert.alert('Error', 'Failed to take photo')
        }
    }
    
    const handleUploadFromGallery = async () => {
        try {
            // 请求媒体库权限
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Media library permission is required to access photos')
                return
            }
            
            // 打开相册
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })
            
            if (!result.canceled && result.assets?.[0]?.uri) {
                console.log('Image selected:', result.assets[0].uri)
                Alert.alert('Image selected', `Image URI: ${result.assets[0].uri}`)
            }
        } catch (error) {
            console.log('Upload from gallery error:', error)
            Alert.alert('Error', 'Failed to select image from gallery')
        }
    }
    
    // ─── Chat Handlers - 复用HomeScreen聊天逻辑 ─────────────────────
    const handleChatPress = () => {
        setChatVisible(true)
    }
    
    const handleCloseChat = () => {
        setChatVisible(false)
    }
    
    const handleSendMessage = () => {
        const messageText = chatInput.trim()
        if (!messageText) return
        
        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'user',
            timestamp: new Date(),
        }
        
        // Add mock assistant response
        const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Thanks! AI response will be connected later.',
            sender: 'assistant',
            timestamp: new Date(),
        }
        
        setChatMessages(prev => [...prev, userMessage, assistantMessage])
        setChatInput('')
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

    // ─── Text Mode Content ───────────────────────────────────
    const renderTextMode = () => (
        <>
            {/* AI Smart Analysis Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons
                        name="sparkles"
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
                    ]}
                    onPress={handleAnalyzeText}
                >
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.analyzeButtonText}>Analyze Now</Text>
                </Pressable>
            </View>

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
                    <Ionicons
                        name="sparkles"
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
                {/* Header with white background - 修复安卓模拟器遮挡问题 */}
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

            {/* FloatingChatButton 同步接入 - 与HomeScreen保持统一 */}
            <FloatingChatButton onPress={handleChatPress} />
            
            {/* Chat Modal - 复用HomeScreen的聊天弹窗逻辑 */}
            <ChatModal
                visible={chatVisible}
                onClose={handleCloseChat}
                messages={chatMessages}
                inputText={chatInput}
                onInputChange={setChatInput}
                onSendMessage={handleSendMessage}
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

    // ── Header - 修复顶部被遮挡问题 ──
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
})
