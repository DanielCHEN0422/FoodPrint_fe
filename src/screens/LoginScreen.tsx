import type { StackScreenProps } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native'
import {
    Button,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper'

import { isValidEmail, useAuth } from '../context/AuthContext'
import type { AuthStackParamList } from '../navigation/types'

type Props = StackScreenProps<AuthStackParamList, 'Login'>

const INSIGHTS = [
    'Small changes in your diet can lead to big improvements in your health.',
    'Eating mindfully helps you enjoy your food and recognize when you\'re full.',
    'Hydration is key—drink water throughout the day for optimal health.',
    'Balanced meals with protein, carbs, and healthy fats fuel your body best.',
    'Quality sleep and nutrition go hand in hand for overall wellness.',
    'Listening to your body\'s hunger cues is the first step to mindful eating.',
    'Consistency, not perfection, is what creates lasting healthy habits.',
    'Colorful plates mean diverse nutrients—eat the rainbow every day.',
    'Your nutrition journey is unique—focus on progress, not comparison.',
    'Whole foods nourish your body better than processed alternatives.',
    'Meal planning saves time and helps you make healthier choices.',
    'Moderation and balance are more sustainable than restriction.',
]

export function LoginScreen({ navigation }: Props) {
    const theme = useTheme()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [todayUsers, setTodayUsers] = useState(0)
    const [insight, setInsight] = useState('')
    const [displayedInsight, setDisplayedInsight] = useState('')

    const themedStyles = useMemo(
        () => ({
            errorBox: { backgroundColor: theme.colors.errorContainer },
            errorText: { color: theme.colors.onErrorContainer },
            formCard: { backgroundColor: theme.colors.surface },
            page: { backgroundColor: '#E8F0E7' },
            statText: { color: '#7C9A79' },
        }),
        [
            theme.colors.errorContainer,
            theme.colors.onErrorContainer,
            theme.colors.surface,
        ]
    )

    useEffect(() => {
        const randomUsers = Math.floor(Math.random() * 500) + 200
        const randomInsight = INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)]
        setTodayUsers(randomUsers)
        setInsight(randomInsight)
    }, [])

    useEffect(() => {
        if (!insight) {
            return
        }

        let index = 0
        setDisplayedInsight('')
        const timer = setInterval(() => {
            if (index <= insight.length) {
                setDisplayedInsight(insight.slice(0, index))
                index += 1
                return
            }

            clearInterval(timer)
        }, 30)

        return () => clearInterval(timer)
    }, [insight])

    const onLogin = async () => {
        setError('')

        if (!email.trim() || !password) {
            setError('Please enter email and password')
            return
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address')
            return
        }

        setSubmitting(true)
        const result = await login(email, password)
        if (!result.success) {
            setError(result.message ?? 'Login failed')
        }
        setSubmitting(false)
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={[styles.page, themedStyles.page]}
        >
            <ScrollView
                contentContainerStyle={styles.pageContent}
                horizontal={false}
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.brandSection}>
                    <Text style={styles.brandTitle}>FoodPrint</Text>
                    <View style={styles.statRow}>
                        <MaterialCommunityIcons
                            color={themedStyles.statText.color}
                            name="account-group-outline"
                            size={20}
                        />
                        <Text style={[styles.statText, themedStyles.statText]}>
                            {todayUsers} people started their nutrition journey today
                        </Text>
                    </View>
                    <View style={styles.insightCard}>
                        <Text style={styles.insightText}>
                            {displayedInsight}
                            <Text style={styles.cursor}>|</Text>
                        </Text>
                    </View>
                </View>

                <View style={[styles.formCard, themedStyles.formCard]}>
                    <Text style={styles.formTitle}>Welcome Back</Text>
                    <Text style={styles.mockHint}>
                        Mock login: any email and password will work
                    </Text>

                    {error ? (
                        <View style={[styles.errorBox, themedStyles.errorBox]}>
                            <MaterialCommunityIcons
                                color={themedStyles.errorText.color}
                                name="alert-circle-outline"
                                size={20}
                            />
                            <Text style={[styles.errorText, themedStyles.errorText]}>
                                {error}
                            </Text>
                        </View>
                    ) : null}

                    <TextInput
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        label="Email"
                        left={<TextInput.Icon icon="email-outline" />}
                        mode="outlined"
                        onChangeText={setEmail}
                        style={styles.input}
                        textContentType="emailAddress"
                        value={email}
                    />
                    <TextInput
                        autoComplete="password"
                        label="Password"
                        left={<TextInput.Icon icon="lock-outline" />}
                        mode="outlined"
                        onChangeText={setPassword}
                        onSubmitEditing={Keyboard.dismiss}
                        returnKeyType="done"
                        secureTextEntry
                        style={styles.input}
                        textContentType="password"
                        value={password}
                    />

                    <Button
                        compact
                        mode="text"
                        onPress={() =>
                            Alert.alert('Notice', 'Password reset is coming soon.')
                        }
                        style={styles.forgotButton}
                    >
                        <Text>Forgot Password?</Text>
                    </Button>

                    <Button
                        buttonColor="#8BA888"
                        disabled={submitting}
                        loading={submitting}
                        mode="contained"
                        onPress={() => void onLogin()}
                        style={styles.signInButton}
                    >
                        <Text>{submitting ? 'Signing In...' : 'Sign In'}</Text>
                    </Button>

                    <View style={styles.registerRow}>
                        <Text>Don\'t have an account?</Text>
                        <Button
                            compact
                            mode="text"
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text>Sign Up</Text>
                        </Button>
                    </View>
                </View>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </Text>
                </View>
            </ScrollView>
            <StatusBar style="auto" />
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    brandSection: {
        marginBottom: 20,
    },
    brandTitle: {
        color: '#2F3E2D',
        fontSize: 38,
        fontWeight: '700',
        marginBottom: 14,
        textAlign: 'center',
    },
    cursor: {
        color: '#8BA888',
    },
    errorBox: {
        alignItems: 'flex-start',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
        padding: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        marginTop: 16,
    },
    footerText: {
        color: '#66756A',
        fontSize: 12,
        textAlign: 'center',
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },
    formCard: {
        borderRadius: 24,
        elevation: 3,
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    formTitle: {
        color: '#324032',
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        marginBottom: 16,
    },
    insightCard: {
        alignItems: 'center',
        backgroundColor: '#F5F8F5',
        borderRadius: 18,
        justifyContent: 'center',
        minHeight: 86,
        padding: 14,
    },
    insightText: {
        color: '#4E5D4D',
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 19,
        textAlign: 'center',
    },
    mockHint: {
        color: '#7B8778',
        fontSize: 13,
        marginBottom: 16,
    },
    page: {
        flex: 1,
    },
    pageContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 24,
    },
    registerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    signInButton: {
        borderRadius: 14,
        marginTop: 2,
        paddingVertical: 2,
    },
    statRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 10,
    },
    statText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
})
