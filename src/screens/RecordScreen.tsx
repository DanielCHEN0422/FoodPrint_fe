import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import React, { useState } from 'react'
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'

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

// ─── Mock Data ───────────────────────────────────────────────
const EXAMPLE_DESCRIPTIONS = [
    'Lunch: Caesar salad with grilled chicken breast, olive oil dressing',
    'Dinner: One bowl of brown rice, steamed fish, stir-fried vegetables',
]

// ─── Handlers ────────────────────────────────────────────────
const handleTakePhoto = () => {
    console.log('Take Photo')
}

const handleUploadFromGallery = () => {
    console.log('Upload from Gallery')
}

const handleAnalyzeText = () => {
    console.log('Analyze Text')
}

const handleChatPress = () => {
    console.log('Chat pressed')
}

// ─── Main Component ──────────────────────────────────────────
export function RecordScreen() {
    const [activeMode, setActiveMode] = useState<RecordMode>('text')
    const [textInput, setTextInput] = useState('')

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
                    <MaterialCommunityIcons
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
                    <MaterialCommunityIcons
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
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    pressed && styles.fabPressed,
                ]}
                onPress={handleChatPress}
            >
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#fff"
                />
            </Pressable>
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

    // ── FAB ──
    fab: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 26,
        bottom: 28,
        elevation: 4,
        height: 52,
        justifyContent: 'center',
        position: 'absolute',
        right: 20,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        width: 52,
    },
    fabPressed: {
        backgroundColor: COLORS.primaryDark,
    },
})
